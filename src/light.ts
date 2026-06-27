import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';
import { ParseState, ToggleState } from './util';

export class Light {
    private service: Service;

    private currentState = {
        isOn: true,
        toggleInProgress: false,
        expectedToggleState: false,
        forceRefresh: false
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

    async setOn(newState: CharacteristicValue) {
        const targetState = newState === true;

        this.platform.log.debug(`---setOn-----${this.accessory.displayName} starting Switch setOn--------------`);
        this.platform.log.debug(`
            isOn: ${this.currentState.isOn};
            newState: ${targetState ? 'on' : 'off'};
            toggleInProgress: ${this.currentState.toggleInProgress};`);
        
        if (this.currentState.toggleInProgress) {
            this.platform.log.debug(`${this.accessory.displayName} device toggle is in progress, setOn request ignored.`);
            return;
        }

        const isDeviceOn = await this.isDeviceOn(true);
        if (isDeviceOn === targetState) {
            this.platform.log.debug(`${this.accessory.displayName}: Device already in requested state, ignoring setOn`);
            return;
        }

        this.currentState.toggleInProgress = true;
        this.currentState.expectedToggleState = targetState;
        this.currentState.forceRefresh = true;

        try {
            const message = await ToggleState(
                this.platform,
                this.accessory.context.deviceConfig.PROCESS_KEY_NUM,
                this.accessory.displayName,
            );
            this.platform.log.debug(`${this.accessory.displayName}: ToggleDeviceState success.
                message: ${message};`);
            this.currentState.isOn = targetState;
        } catch (error) {
            this.platform.log.error(`${this.accessory.displayName}: error getting device state: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        } finally {
            this.currentState.toggleInProgress = false;
        }
    }

    async getOn(): Promise<CharacteristicValue> {
        this.platform.log.debug(`---getOn-----${this.accessory.displayName} Starting getOn--------------`);
        this.platform.log.debug(`
            isOn: ${this.currentState.isOn};
            forceRefresh: ${this.currentState.forceRefresh};
            toggleInProgress: ${this.currentState.toggleInProgress}`);

        if (this.currentState.toggleInProgress) {
            this.platform.log.debug(`${this.accessory.displayName}: Toggle in progress, getOn request ignored.
            expectedToggleState: ${this.currentState.expectedToggleState},`);
            return this.currentState.expectedToggleState;
        }

        const isDeviceOn = await this.isDeviceOn(this.currentState.forceRefresh);
        this.currentState.isOn = isDeviceOn;
        this.currentState.forceRefresh = false;
            
        return isDeviceOn;
    }

    async isDeviceOn(forceRefresh = false): Promise<boolean> {
        try {
            const deviceState = await ParseState(
                this.platform,
                this.accessory.context.deviceConfig.STATUS_KEY_INDEX,
                this.accessory.displayName,
                forceRefresh,
            );

            this.platform.log.debug(`${this.accessory.displayName}: ParseState success.
                deviceState: ${deviceState};`);

            return deviceState === 'on';
        } catch (error) {
            this.platform.log.error(`${this.accessory.displayName}: ParseState error: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
    }
}
