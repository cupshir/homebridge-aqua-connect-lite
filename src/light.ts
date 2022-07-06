import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';
import { GetDeviceState, ToggleDeviceState } from './util'
import { ACCESSORY_INFO } from './settings';

export class Light {
    private service: Service;

    private currentState = {
        IsOn: true
    };

    constructor(
        private readonly platform: AquaConnectLitePlatform,
        private readonly accessory: PlatformAccessory) {

        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
    }

    async setOn(value: CharacteristicValue) {
        this.platform.log.debug('--Starting setOn');
        this.platform.log.debug(`--currentState.IsOn: ${this.currentState.IsOn}`);

        let toggleDevice = false;

        // check our device state to determine if we need to send the toggle request
        // this ensures if device was toggled manually, then we get homebridge in sync
        // before trying to toggle again, its annoying when homebridge state is opposite
        // the real state...
        await GetDeviceState(
            this.platform,
            ACCESSORY_INFO.LIGHT.STATUS_KEY_INDEX)
        .then((deviceState) => {
            if ((deviceState === 'on' && this.currentState.IsOn)
                || (deviceState === 'off' && !this.currentState.IsOn)) {
                toggleDevice = true;

                this.platform.log.debug(`--toggleDevice: ${toggleDevice}`);

                if (toggleDevice) {
                    // device is not in requested state, toggle it
                    ToggleDeviceState(
                        this.platform,
                        ACCESSORY_INFO.LIGHT.PROCESS_KEY_NUM)
                    .then((message) => {
                        // due to the way aqua connect works, the response from the toggle
                        // is not helpful (i think its returning the current state of the 
                        // LCD screen BEFORE the button press is executed, aka not helpful)
                        // we will require another getOn request which homebridge will trigger
                        // after setOn is complete, so we assume the toggle worked and getOn 
                        // will correct it if needed
                        this.platform.log.debug(`--ToggleDeviceState message: ${message}`);
        
                        this.currentState.IsOn = !this.currentState.IsOn;
        
                        this.platform.log.debug(`--ToggleDeviceState finished.`);
                        this.platform.log.debug(`--currentState.IsOn: ${this.currentState.IsOn}`);
                    })
                    .catch( (error) => {                        
                        this.platform.log.error(`--Error toggling light device: ${error}`);
                        throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                    });
                }   
            } 
        })
        .catch((error) => {
            this.platform.log.error(`--Error getting light device state: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        });
    }

    async getOn(): Promise<CharacteristicValue> {
        this.platform.log.debug('-Starting getOn');
        this.platform.log.debug(`-currentState.IsOn: ${this.currentState.IsOn}`);

        // send request to get our device state
        await GetDeviceState(
                this.platform,
                ACCESSORY_INFO.LIGHT.STATUS_KEY_INDEX)
            .then((deviceState) => {
                this.currentState.IsOn = deviceState === 'on';
            })
            .catch((error) => {
                this.platform.log.error(`-Error getting light device state: ${error}`);
                throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            });

        this.platform.log.debug(`-currentState.IsOn: ${this.currentState.IsOn}`);
        this.platform.log.debug(`-getOn finished`);
            
        return this.currentState.IsOn;
    }
}
