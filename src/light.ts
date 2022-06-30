import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';

import { GetDeviceState } from './util'

export class Light {
  private service: Service;

  private currentState = {
    On: true,
  };

  private hostname = '192.168.86.59';
  private path = '/WNewSt.htm';

  constructor(
    private readonly platform: AquaConnectLitePlatform,
    private readonly accessory: PlatformAccessory,
  ) {

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, 'Pool Light');

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off

    // let postOptions = {
    //   hostname: '192.168.86.59',
    //   //      port: 80,
    //   path: '/WNewSt.htm',
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //     'Content-Length': 9,
    //     'Connection': 'close',
    //   },
    // };

    // // // // const req = http.request(postOptions, res => {
    // // // //   this.platform.log.debug(`statusCode: ${res.statusCode}`);

    // // // //   res.on('data', d => {
    // // // //     this.platform.log.debug(`data: ${d}`);
    // // // //   });
    // // // // });

    // // // // req.on('error', error => {
    // // // //   this.platform.log.debug(`error: ${error}`);
    // // // // });

    // // // // const data = encodeURI('KeyId=09&');

    // // // // req.write(data);
    // // // // req.end();



    //this.exampleStates.On = value as boolean;

    //this.platform.log.debug('Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  async getOn(): Promise<CharacteristicValue> {
    // send request to get our device state
    let postBody = encodeURI('Update Local Server&');

    GetDeviceState(this.hostname, this.path, postBody, 'light')
      .then( (deviceState) => {
        console.log(`deviceState: ${deviceState}`);

        if (deviceState === 'on'){
          this.currentState.On = true;
        } else {
          this.currentState.On = false;
        }
      })
      .catch( (error) => {
        console.log(`lightError: ${error}`);
      });
 
    // TODO figure out what to do with this
    // if you need to return an error to show the device as "Not Responding" in the Home app:
    // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

    return this.currentState.On;
  }

}
