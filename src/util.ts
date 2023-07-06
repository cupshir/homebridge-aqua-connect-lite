import { AquaConnectLitePlatform } from './platform';

import axios from 'axios';
import { parse } from 'node-html-parser';

import { AC_API_SETTINGS, ACCESSORY_MODE } from './settings';

const ParseMode = async (platform: AquaConnectLitePlatform, requester: string, forceRefresh = false): Promise<string> => {
	const logTitle = `${requester} ParseMode: `;
	const response = await getResponse(platform, requester, forceRefresh);

	platform.log.debug(`${logTitle} response: ${response}`);

	// get the raw led status from the html response
	const rawLedStatus = GetRawLedStatus(response);
	platform.log.debug(`${logTitle} rawLEDStatus: ${rawLedStatus}`);

	const mode = rawLedStatus.substring(0, 1);
	let parsedMode = '';
	switch (mode) {
		case 'T':
			parsedMode = ACCESSORY_MODE.POOL;
			break;
	case 'E':
			parsedMode = ACCESSORY_MODE.SPA;
			break;
	case 'D':
			parsedMode = ACCESSORY_MODE.SPILLOVER;
			break;
		default:
			break;
	}

	return parsedMode;
};

const ParseState = async (platform: AquaConnectLitePlatform, deviceKeyIndex: number, requester: string, forceRefresh = false): Promise<string> => {
	const logTitle = `${requester} ${deviceKeyIndex} ParseState: `;
	const response = await getResponse(platform, requester, forceRefresh);

	platform.log.debug(`${logTitle} response: ${response}`);

	// get the raw led status from the html response
	const rawLedStatus = GetRawLedStatus(response);
	platform.log.debug(`${logTitle} rawLEDStatus: ${rawLedStatus}`);

	// convert the raw led status into ascii byte string
	const asciiByteString = ConvertToAsciiByteString(rawLedStatus);
	platform.log.debug(`${logTitle} asciiByteString: ${asciiByteString}`);

	// the ascii byte string has 24 bits that indicate the status
	// of various led's on the controller
	// using our device key index, get the respective led status
	const ledStatus = GetLedStatus(asciiByteString, deviceKeyIndex);
	platform.log.debug(`${logTitle} ledStatus: ${ledStatus}`);

	return ledStatus;
}

const getResponse = async (platform: AquaConnectLitePlatform, requester: string, forceRefresh = false): Promise<string> => {
	const logTitle = `${requester} getResponse: `;
	while (platform.requestInProgress) {
		if (platform.requestInProgress) {
			platform.log.debug(`${logTitle} request in progress, sleeping ${platform.config.get_delay}ms`);

			await Sleep(platform.config.get_delay);
		}
	}

	let response = platform.lastResponse;

	const now = Date.now();
	if (forceRefresh || !response || now - platform.lastRequest > platform.config.get_cache_threshold) {
		platform.requestInProgress = true;
		platform.log.debug(`${logTitle} forceRefresh: ${forceRefresh}; refreshForced = true, lastResponse empty or older than ${platform.config.get_cache_threshold}ms, requesting new response.`);
		await GetDeviceState(platform)
			.then((newResponse) => {
				platform.log.debug(`${logTitle} newResponse: ${newResponse}`);
				response = newResponse;

				platform.lastResponse = newResponse;
				platform.lastRequest = Date.now();
				platform.requestInProgress = false;
			})
			.catch((error) => {
				platform.log.debug(`${logTitle} GetDeviceState failed. Error: ${error}`);
				
				platform.requestInProgress = false;
				response = '';
			});
	} else {
		platform.log.debug(`${logTitle} using cached response. platform.lastResponse: ${platform.lastResponse}`);
	}

	return response;
}

const GetDeviceState = (platform: AquaConnectLitePlatform): Promise<string> => {
	return new Promise<string>((resolve, reject) => {
		const body = AC_API_SETTINGS.UPDATE_LOCAL_SERVER_POST_BODY;
		
		const config = {
			method: 'post',
			url: `http://${platform.config.bridge_ip_address}${AC_API_SETTINGS.PATH}`,
			headers: { 
				'Content-Type': 'application/x-www-form-urlencoded', 
				'Content-Length': `${body.length}`, 
				'Connection': 'close'
			},
			data : body
		};
			
		axios(config)
			.then(function (response) {
				resolve(response.data);
			})
			.catch(function (error) {
				reject(error);
			});
	});
};


const ToggleState = (platform: AquaConnectLitePlatform, processKeyNum: string, requester: string): Promise<string> => {
	return new Promise<string>((resolve,reject) => {
		const logTitle = `${requester} ${processKeyNum} ToggleDeviceState: `;
		const body = "KeyId=" + processKeyNum + "&";

		const config = {
			method: 'post',
			url: `http://${platform.config.bridge_ip_address}${AC_API_SETTINGS.PATH}`,
			headers: { 
				'Content-Type': 'application/x-www-form-urlencoded', 
				'Content-Length': `${body.length}`, 
				'Connection': 'close'
			},
			data : body
		};
		
		axios(config)
			.then(function (response) {
				platform.log.debug(`${logTitle} responseData: ${response.data}`);
				resolve('success');
			})
			.catch(function (error) {
				reject(error);
			});
	});
};

const GetRawLedStatus = (htmlData: string): string => {
	const lcdResults = parse(htmlData);

	const splitResults = lcdResults.querySelector('body')?.text.split('xxx');

	if (splitResults && splitResults.length >= 2) {
		return splitResults[2].trim().toString();
	}        

	return '';
}

const GetLedStatus = (asciiByteString: string, deviceKeyIndex: number): string => {
		let statusString = '';

		if (deviceKeyIndex >= 0 && deviceKeyIndex < asciiByteString.length) {
			const statusCode = asciiByteString[deviceKeyIndex];
			switch (statusCode) {
				case "3":
					statusString = 'nokey';
					break;
				case "4":
					statusString = 'off';
					break;
				case "5":
					statusString = 'on';
					break;
				case "6":
					statusString = 'blink';
					break;			
				default:
					break;
			}
		}		

		return statusString;
}

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
}

const Sleep = async (duration = 1000) => {
	await new Promise(resolve => setTimeout(resolve, duration));
}

export { ParseMode, ParseState, GetDeviceState, ToggleState, Sleep }
