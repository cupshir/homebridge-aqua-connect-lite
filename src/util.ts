import { AquaConnectLitePlatform } from './platform';

import http from 'http';
import { parse } from 'node-html-parser';

import { AC_API_SETTINGS } from './settings';

export const GetDeviceState = (platform: AquaConnectLitePlatform, deviceKeyIndex: number): Promise<string> => {
	return new Promise<string>((resolve, reject) => {
		const postOptions = {
			hostname: platform.config.bridge_ip_address,
			path: AC_API_SETTINGS.PATH,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': AC_API_SETTINGS.UPDATE_LOCAL_SERVER_POST_BODY.length,
				'Connection': 'close',
			}
		};

		platform.log.debug(`Starting GetDeviceState for device key index: ${deviceKeyIndex}`);
		
		// setup the request
		const req = http.request(postOptions, response => {
			platform.log.debug(`response statusCode: ${response.statusCode}`);

			if (response.statusCode === 200) {
				// successfull response
				platform.log.debug('Update Local Server request successful.')

				let responseData = '';
		
				// build responseData
				response.on('data', (chunk) => {
					responseData += chunk;
				});
				
				// we have our response data now process it
				response.on('end', () => {
					platform.log.debug('Starting response processing');
					platform.log.debug(`responseData: ${responseData}`);

					// get the raw led status from the html response
					const rawLedStatus = GetRawLedStatus(responseData);
					platform.log.debug(`rawLEDStatus: ${rawLedStatus}`);

					// convert the raw led status into ascii byte string
					const asciiByteString = ConvertToAsciiByteString(rawLedStatus);
					platform.log.debug(`asciiByteString: ${asciiByteString}`);
			
					// the ascii byte string has 24 bits that indicate the status
					// of various led's on the controller
					// using our device type, get the respective led status
					const ledStatus = GetLedStatus(asciiByteString, deviceKeyIndex);
					platform.log.debug(`ledStatus: ${ledStatus}`);

					resolve(ledStatus);
				});
			}
		});
		
		// return error
		req.on('error', error => {
			reject(`error: ${error}`);
		});
	
		// send request
		req.write(AC_API_SETTINGS.UPDATE_LOCAL_SERVER_POST_BODY);
		req.end();
	});
};

export const ToggleDeviceState = (platform: AquaConnectLitePlatform, processKeyNum: string): Promise<string> => {
	return new Promise<string>((resolve,reject) => {
		const body = "KeyId=" + processKeyNum + "&";

		const postOptions = {
			hostname: platform.config.bridge_ip_address,
			path: AC_API_SETTINGS.PATH,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': body.length,
				'Connection': 'close',
			}
		};

		platform.log.debug(`Starting ToggleDeviceState for process key: ${processKeyNum}`);

		const req = http.request(postOptions, response => {
			platform.log.debug(`response statusCode: ${response.statusCode}`);

			if (response.statusCode === 200) {
				// we need a slight delay to give the pool controller
				// time to update its display
				setTimeout(function() {
					resolve('success');
				}, 300);
			}
		});

		// return error
		req.on('error', error => {
			reject(`toggleDeviceStateError: ${error}`)
		});

		// send request
		req.write(body);
		req.end();
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
