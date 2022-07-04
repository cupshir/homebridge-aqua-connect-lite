import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';
import { GetDeviceState, ToggleDeviceState } from './util'
import { ACCESSORY_INFO } from './settings';

export class Light {
    private service: Service;

    private currentState = {
        On: true,
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
        this.platform.log.debug('Starting setOn');
        this.platform.log.debug(`setOn currentState: ${this.currentState.On}`);

        let toggleDevice = false;

        // check our device state to determine if we need to send the toggle request
        // this ensures if device was toggled manually, then we get homebridge in sync
        // before trying to toggle again, its annoying when homebridge state is opposite
        // the real state...
        await GetDeviceState(
            this.platform,
            ACCESSORY_INFO.LIGHT.STATUS_KEY_INDEX)
        .then((deviceState) => {
            if ((deviceState === 'on' && this.currentState.On)
                || (deviceState === 'off' && !this.currentState.On)) {
                toggleDevice = true;

                this.platform.log.debug(`setOn toggleDevice: ${toggleDevice}`);
            } 
        })
        .catch((error) => {
            this.platform.log.error(`Error getting light device state: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        });

        if (toggleDevice) {
            // device is not in requested state, toggle it
            await ToggleDeviceState(
                this.platform,
                ACCESSORY_INFO.LIGHT.PROCESS_KEY_NUM)
            .then((response) => {
                // due to the way aqua connect works, the response from the toggle
                // is not helpful, we require another getOn request
                // which homebridge will trigger after setOn is complete
                // so we assume the toggle worked and getOn will correct it if needed
                this.platform.log.debug(`ToggleDeviceState response: ${response}`);

                this.currentState.On = !this.currentState.On;

                this.platform.log.debug(`ToggleDeviceState finished. currentState: ${this.currentState.On}`);
            })
            .catch( (error) => {
                this.platform.log.error(`Error toggling light device: ${error}`);
                throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            });
        }        
    }

    async getOn(): Promise<CharacteristicValue> {
        this.platform.log.debug('Starting getOn');
        this.platform.log.debug(`get currentState: ${this.currentState.On}`);

        // send request to get our device state
        await GetDeviceState(
                this.platform,
                ACCESSORY_INFO.LIGHT.STATUS_KEY_INDEX)
            .then((deviceState) => {
                this.currentState.On = deviceState === 'on';
            })
            .catch((error) => {
                this.platform.log.error(`Error getting light device state: ${error}`);
                throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            });

        this.platform.log.debug(`getOn finished. currentState: ${this.currentState.On}`);
            
        return this.currentState.On;
    }
}
