import { Service, PlatformAccessory, Characteristic } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';
import { GetDeviceState, GetPoolTemp } from './util'

export class Temperature {
    private service: Service;

    private requestInterval: NodeJS.Timer;

    private test;

    // private currentState = {
    //     IsOn: true,
    //     ToggleInProgress: false,
    //     ExpectedToggleState: false
    // };

    constructor(
        private readonly platform: AquaConnectLitePlatform,
        private readonly accessory: PlatformAccessory) {

        this.service = this.accessory.getService(this.platform.Service.TemperatureSensor) || this.accessory.addService(this.platform.Service.TemperatureSensor);

        this.service.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);

        this.service.getCharacteristic(this.platform.Characteristic.CurrentTemperature)
            .onGet(this.handleTemperatureGet.bind(this));

        this.test = this;
        this.requestInterval = setInterval(this.requestTemperature.bind(this), 5000);
    }

    // async startRequestInterval() {
        
    // }

    handleTemperatureGet() {
        this.platform.log.debug('Triggered GET CurrentTemperature');

        if (!this.accessory.context.lastTemp) {
            this.accessory.context.lastTemp = -270;
        }

        return this.accessory.context.lastTemp;
    }

    async requestTemperature() {
        await GetPoolTemp(this.platform)
            .then(() => {

                this.platform.log.debug('requestTempaterature triggered..........');

                const fakeTemp = Math.floor(Math.random() * (50 - 0 +1) + 0);

                this.accessory.context.lastTemp = fakeTemp;

                // this.platform.log.debug('----temp-----');
                // this.platform.log.debug(temp);
            })
            .catch((error) => {
                //this.platform.log.error(`${this.accessory.displayName} error getting device state: ${error}`);
                throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            });
        return '';
    }

}
