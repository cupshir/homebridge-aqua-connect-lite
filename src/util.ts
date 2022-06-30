import http from 'http';
import { parse } from 'node-html-parser';

export const GetDeviceState = (
		hostname: string, path: string, body: string, device: string
	): Promise<string> => {
		return new Promise<string>( (resolve, reject) => {
			let postOptions = {
				hostname: hostname,
				path: path,
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Content-Length': body.length,
					'Connection': 'close',
				},
			};
		  
			// setup the request
			const req = http.request(postOptions, response => {
				if (response.statusCode === 200) {
					// successfull response, get the response data
					let responseData = '';
			
					response.on('data', (chunk) => {
						responseData += chunk;
					});
					
					// we have our response data now process it
					response.on('end', () => {
						// get the raw led status from the html response
						let rawLedStatus = GetRawLedStatus(responseData);
						
						// convert the raw led status into ascii byte string
						let asciiByteString = ConvertToAsciiByteString(rawLedStatus);
				
						// the ascii byte string has 24 bits that indicate the status
						// of various led's on the controller
						// using our device type, get the respective led status
						resolve(GetLedStatus(asciiByteString,device));
					});
				}
			});
		  
			// return error
			req.on('error', error => {
				reject(`error: ${error}`);
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

function GetProcessKey(device: string) {
	let processKey = '';

	switch (device) {
		case 'filter':
			processKey = '08';
			break;
		case 'aux1':
			processKey = '0A';
			break;
		case 'light':
			processKey = '09';
			break;
		default:
			break;
	}

	return processKey;
}

const GetKeyIndex = (device: string): number => {
	let keyIndex = -1;

	switch (device) {
		case 'filter':
			keyIndex = 3;
		case 'aux1':
			keyIndex = 9;
		case 'light':
			keyIndex = 4;
			break;	
		default:
			break;
	}

	return keyIndex;
}

const GetLedStatus = (
		asciiByteString: string, device: string
	): string => {
		let statusString = '';

		let keyIndex = GetKeyIndex(device);
		if (keyIndex > -1) {
			let statusCode = asciiByteString[keyIndex];
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
