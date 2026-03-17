import { AquaConnectLitePlatform } from './platform';

import axios from 'axios';
import { parse } from 'node-html-parser';

import { AC_API_SETTINGS, ACCESSORY_MODE, AccessoryMode } from './settings';

export type DeviceState = 'on' | 'off' | 'blink' | 'nokey';

type RequestImplementation = (
	platform: AquaConnectLitePlatform,
	body: string,
	minDelayMs: number,
) => Promise<string>;

const ParseMode = async (platform: AquaConnectLitePlatform, requester: string, forceRefresh = false): Promise<AccessoryMode> => {
	const logTitle = `${requester} ParseMode: `;
	const response = await getResponse(platform, requester, forceRefresh);

	platform.log.debug(`${logTitle} response: ${response}`);

	const rawLedStatus = GetRawLedStatus(response);
	platform.log.debug(`${logTitle} rawLEDStatus: ${rawLedStatus}`);

	const mode = rawLedStatus.substring(0, 1);
	switch (mode) {
		case 'T':
			return ACCESSORY_MODE.POOL;
		case 'E':
			return ACCESSORY_MODE.SPA;
		case 'D':
			return ACCESSORY_MODE.SPILLOVER;
		default:
			throw new Error(`Unable to determine current mode from raw status "${rawLedStatus}".`);
	}
};

const ParseState = async (platform: AquaConnectLitePlatform, deviceKeyIndex: number, requester: string, forceRefresh = false): Promise<DeviceState> => {
	const logTitle = `${requester} ${deviceKeyIndex} ParseState: `;
	const response = await getResponse(platform, requester, forceRefresh);

	platform.log.debug(`${logTitle} response: ${response}`);

	const rawLedStatus = GetRawLedStatus(response);
	platform.log.debug(`${logTitle} rawLEDStatus: ${rawLedStatus}`);

	const asciiByteString = ConvertToAsciiByteString(rawLedStatus);
	platform.log.debug(`${logTitle} asciiByteString: ${asciiByteString}`);

	const ledStatus = GetLedStatus(asciiByteString, deviceKeyIndex);
	platform.log.debug(`${logTitle} ledStatus: ${ledStatus}`);

	return ledStatus;
};

const getResponse = async (platform: AquaConnectLitePlatform, requester: string, forceRefresh = false): Promise<string> => {
	const logTitle = `${requester} getResponse: `;

	const shouldUseCache = !forceRefresh
		&& platform.lastResponse
		&& Date.now() - platform.lastResponseAt <= platform.getGetCacheThreshold();

	if (shouldUseCache) {
		platform.log.debug(`${logTitle} using cached response. platform.lastResponse: ${platform.lastResponse}`);
		return platform.lastResponse;
	}

	if (!platform.pendingRefresh) {
		platform.pendingRefresh = GetDeviceState(platform)
			.then((response) => {
				platform.lastResponse = response;
				platform.lastResponseAt = Date.now();
				platform.log.debug(`${logTitle} refreshed response.`);
				return response;
			})
			.finally(() => {
				platform.pendingRefresh = undefined;
			});
	}

	return platform.pendingRefresh;
};

const GetDeviceState = (platform: AquaConnectLitePlatform): Promise<string> => {
	const body = AC_API_SETTINGS.UPDATE_LOCAL_SERVER_POST_BODY;

	return requestImplementation(platform, body, platform.getGetDelay());
};


const ToggleState = (platform: AquaConnectLitePlatform, processKeyNum: string, requester: string): Promise<string> => {
	const logTitle = `${requester} ${processKeyNum} ToggleDeviceState: `;
	const body = `KeyId=${processKeyNum}&`;

	return requestImplementation(platform, body, platform.getSetDelay()).then((response) => {
		platform.log.debug(`${logTitle} responseData: ${response}`);
		return 'success';
	});
};

const GetRawLedStatus = (htmlData: string): string => {
	const lcdResults = parse(htmlData);

	const splitResults = lcdResults.querySelector('body')?.text.split('xxx');

	if (splitResults && splitResults.length >= 3 && splitResults[2]) {
		return splitResults[2].trim().toString();
	}        

	throw new Error('Unable to parse LED status from AquaConnect response.');
};

const GetLedStatus = (asciiByteString: string, deviceKeyIndex: number): DeviceState => {
	if (deviceKeyIndex < 0 || deviceKeyIndex >= asciiByteString.length) {
		throw new Error(`LED status index ${deviceKeyIndex} is out of bounds for "${asciiByteString}".`);
	}

	const statusCode = asciiByteString[deviceKeyIndex];
	switch (statusCode) {
		case '3':
			return 'nokey';
		case '4':
			return 'off';
		case '5':
			return 'on';
		case '6':
			return 'blink';
		default:
			throw new Error(`Unknown LED status code "${statusCode}" at index ${deviceKeyIndex}.`);
	}
};

const ConvertToAsciiByteString = (rawLedStatus: string): string => {
	let asciiByteString = '';
	for (let i = 0; i < rawLedStatus.length; i++) {
		asciiByteString += ExtractNibbles(rawLedStatus[i]); 		
	}

	return asciiByteString;
}

const ExtractNibbles = (asciiByte: string): string => {
	let nibbles = "00"; 

	switch ( asciiByte )
    {
		case "3":
			nibbles = "33"; 
			break;
		case "4":
			nibbles = "34"; 
			break;
		case "5":
			nibbles = "35"; 
			break;
		case "6":
			nibbles = "36"; 
			break;
		case "C":
			nibbles = "43"; 
			break;
		case "D":
			nibbles = "44"; 
			break;
		case "E":
			nibbles = "45"; 
			break;
		case "F":
			nibbles = "46"; 
			break;
		case "S":
			nibbles = "53"; 
			break;
		case "T":
			nibbles = "54"; 
			break;
		case "U":
			nibbles = "55"; 
			break;
		case "V":
			nibbles = "56"; 
			break;
		case "c":
			nibbles = "63"; 
			break;
		case "d":
			nibbles = "64"; 
			break;
		case "e":
			nibbles = "65"; 
			break;
		case "f":
			nibbles = "66"; 
			break;
      default:
    }

	return nibbles;	
};

const queueRequest = async <T>(
	platform: AquaConnectLitePlatform,
	minDelayMs: number,
	requestFactory: () => Promise<T>,
): Promise<T> => {
	const runRequest = async () => {
		const elapsed = Date.now() - platform.lastRequestAt;
		const waitTime = Math.max(0, minDelayMs - elapsed);
		if (waitTime > 0) {
			await Sleep(waitTime);
		}

		try {
			return await requestFactory();
		} finally {
			platform.lastRequestAt = Date.now();
		}
	};

	const queuedRequest = platform.requestQueue.then(runRequest, runRequest);
	platform.requestQueue = queuedRequest.then(() => undefined, () => undefined);
	return queuedRequest;
};

const defaultRequestImplementation: RequestImplementation = async (platform, body, minDelayMs) => {
	return queueRequest(platform, minDelayMs, async () => {
		const response = await axios({
			method: 'post',
			url: `http://${platform.config.bridge_ip_address}${AC_API_SETTINGS.PATH}`,
			timeout: AC_API_SETTINGS.REQUEST_TIMEOUT_MS,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': `${body.length}`,
				'Connection': 'close',
			},
			data: body,
		});

		return response.data;
	});
};

let requestImplementation: RequestImplementation = defaultRequestImplementation;

const Sleep = async (duration = 1000) => {
	await new Promise(resolve => setTimeout(resolve, duration));
};

export const __testing = {
	GetRawLedStatus,
	GetLedStatus,
	ConvertToAsciiByteString,
	ExtractNibbles,
	getResponse,
	queueRequest,
	setRequestImplementation(nextImplementation: RequestImplementation) {
		requestImplementation = nextImplementation;
	},
	resetRequestImplementation() {
		requestImplementation = defaultRequestImplementation;
	},
};

export { ParseMode, ParseState, GetDeviceState, ToggleState, Sleep };
