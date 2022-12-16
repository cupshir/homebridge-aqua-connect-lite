import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';
import { GetDeviceState, ToggleDeviceState } from './util'

export class Light {
    private service: Service;

    private currentState = {
        IsOn: true,
        ToggleInProgress: false,
        ExpectedToggleState: false
    };

    constructor(
        private readonly platform: AquaConnectLitePlatform,
        private readonly accessory: PlatformAccessory) {

        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

        this.service.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
    }

    async setOn(value: CharacteristicValue) {
        this.platform.log.debug('---------------------------');
        this.platform.log.debug(`${this.accessory.displayName} starting setOn. currentState.IsOn: ${this.currentState.IsOn}; currentState.ToggleInProgress: ${this.currentState.ToggleInProgress}`);

        if (this.currentState.ToggleInProgress) {
            this.platform.log.debug(`${this.accessory.displayName} device toggle is in progress, setOn request ignored.`);
            return;
        }

        // check our device state to determine if we need to send the toggle request
        // this ensures if device was toggled manually, then we get homebridge in sync
        // before trying to toggle again, its annoying when homebridge state is opposite
        // the real state...
        await GetDeviceState(
            this.platform,
            this.accessory.context.device.STATUS_KEY_INDEX)
        .then((deviceState) => {
            if ((deviceState === 'on' && this.currentState.IsOn)
                || (deviceState === 'off' && !this.currentState.IsOn)) {
                this.platform.log.debug(`${this.accessory.displayName} starting toggle device state. deviceState: ${deviceState}`);

                this.currentState.ToggleInProgress = true;
                // expected toggle state is used to for a more responsive UI feel
                // if toggle is in progress, getOn will return the expected toggle state
                // we assume the expected toggle state is opposite of the current isOn state
                this.currentState.ExpectedToggleState = !this.currentState.IsOn;

                ToggleDeviceState(
                    this.platform,
                    this.accessory.context.device.PROCESS_KEY_NUM)
                .then((message) => {
                    // due to the way aqua connect works, the response from the toggle
                    // is not helpful (i think its returning the current state of the 
                    // LCD screen BEFORE the button press is executed, aka not helpful)
                    // we will require another getOn request which homebridge will trigger
                    // after setOn is complete, so we assume the toggle worked and getOn 
                    // will correct it if needed    
                    this.currentState.IsOn = !this.currentState.IsOn;
                    this.currentState.ToggleInProgress = false;
    
                    this.platform.log.debug(`${this.accessory.displayName} ToggleDeviceState success. message: ${message}`);
                    this.platform.log.debug(`${this.accessory.displayName} new currentState.IsOn: ${this.currentState.IsOn}`);
                })
                .catch( (error) => {       
                    this.currentState.ToggleInProgress = false;                 
                    this.platform.log.error(`${this.accessory.displayName} error toggling device state: ${error}`);
                    throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
                });                 
            } 
        })
        .catch((error) => {
            this.platform.log.error(`${this.accessory.displayName} error getting device state: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        });
    }

    async getOn(): Promise<CharacteristicValue> {
        this.platform.log.debug('---------------------------');
        this.platform.log.debug(`${this.accessory.displayName} Starting getOn. currentState.IsOn: ${this.currentState.IsOn}; currentState.ToggleInProgress: ${this.currentState.ToggleInProgress}`);

        if (this.currentState.ToggleInProgress) {
            this.platform.log.debug(`${this.accessory.displayName} device toggle is in progress, getOn request ignored.`);
            return this.currentState.ExpectedToggleState;
        }

        // send request to get our device state
        await GetDeviceState(
                this.platform,
                this.accessory.context.device.STATUS_KEY_INDEX)
            .then((deviceState) => {
                this.currentState.IsOn = deviceState === 'on';

                this.platform.log.debug(`${this.accessory.displayName} GetDeviceState success. deviceState: ${deviceState}`);
                this.platform.log.debug(`${this.accessory.displayName} new currentState.IsOn: ${this.currentState.IsOn}`);
            })
            .catch((error) => {
                this.platform.log.error(`${this.accessory.displayName} error getting device state: ${error}`);
                throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            });
            
        return this.currentState.IsOn;
    }
}
