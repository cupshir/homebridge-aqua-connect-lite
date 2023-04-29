import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';
import { ParseMode, ToggleState, Sleep } from './util'

export class ModeSwitch {
    private service: Service;

    private isOn: boolean;

    constructor(
        private readonly platform: AquaConnectLitePlatform,
        private readonly accessory: PlatformAccessory) {

        this.isOn = false;

        this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

        this.service.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
    }

    async setOn(newState: CharacteristicValue) {
        this.platform.log.debug(`---setOn-----${this.accessory.displayName} starting ModeSwitch setOn--------------`);
        this.platform.log.debug(`
            isOn: ${this.isOn};
            newState: ${newState};
            currentMode: ${this.platform.currentMode};
            modeToggleInProgress: ${this.platform.modeToggleInProgress};`);

        if (this.platform.currentMode == this.accessory.context.deviceConfig.MODE) {
            this.platform.log.debug(`${this.accessory.displayName}: Device already in requested mode, ignoring setOn`);
            return;
        }
        
        if (this.platform.modeToggleInProgress) {
            this.platform.log.debug(`${this.accessory.displayName}: Mode toggle in progress, setOn request ignored.
                expectedMode: ${this.platform.expectedMode};`);
            return;
        }

        this.processSetOn(newState)
            .then((response) => {
                this.platform.log.debug(`${this.accessory.displayName}: ModeSwitch setOn success.
                    ${response}`);

            })
            .catch((error) => {
                this.platform.log.debug(`${this.accessory.displayName}: ModeSwitch setOn failed.
                    ${error}`);
            });
    }

    async getOn(): Promise<CharacteristicValue> {
        this.platform.log.debug(`---getOn-----${this.accessory.displayName} Starting getOn--------------`);
        this.platform.log.debug(`
            isOn: ${this.isOn};
            currentMode: ${this.platform.currentMode};
            modeToggleInProgress: ${this.platform.modeToggleInProgress}`);

        if (this.platform.modeToggleInProgress) {
            this.platform.log.debug(`${this.accessory.displayName}: Mode toggle in progress, getOn request ignored.
                expectedMode: ${this.platform.expectedMode},`);
            return this.accessory.context.deviceConfig.MODE === this.platform.expectedMode;
        }

        const isDeviceOn = await this.isDeviceOn();

        if (isDeviceOn) {
            this.isOn = true;
            this.platform.currentMode = this.accessory.context.deviceConfig.MODE;
        } else {
            this.isOn = false;
        }
            
        return isDeviceOn;
    }

    async processSetOn(newState: CharacteristicValue): Promise<string> {
        this.platform.log.debug(`---processSetOn----${this.accessory.displayName} Starting processSetOn--------------`);

        // toggle device
        this.platform.modeToggleInProgress = true;
        this.platform.expectedMode = this.accessory.context.deviceConfig.MODE;

        this.platform.log.debug(`${this.accessory.displayName}: 1st toggle device.
            currentMode: ${this.platform.currentMode};`);

        await this.toggleDevice();
        
        await Sleep(this.platform.config.set_delay);

        let isDeviceOn = await this.isDeviceOn(true);
        if (!isDeviceOn) {
            // device not in correct state, toggle a 2nd time
            await Sleep(this.platform.config.set_delay);

            this.platform.log.debug(`${this.accessory.displayName}: 2nd toggle device.
                currentMode: ${this.platform.currentMode};`);

            await this.toggleDevice();

            // check again to see if we made it into the correct state
            await Sleep(this.platform.config.set_delay);

            isDeviceOn = await this.isDeviceOn(true);
        }

        this.platform.modeToggleInProgress = false;
        this.platform.expectedMode = '';

        if (!isDeviceOn) {
            throw new Error(`${this.accessory.displayName}: processSetOn something failed.`);
        }

        this.isOn = true;
        this.platform.currentMode = this.accessory.context.deviceConfig.MODE;

        return `${this.accessory.displayName}: processSetOn success.`;
    }

    async isDeviceOn(forceRefresh = false) {
        let isDeviceOn = false;

        await ParseMode(this.platform, this.accessory.displayName, forceRefresh)
        .then((deviceMode) => {
            isDeviceOn = this.accessory.context.deviceConfig.MODE === deviceMode;

            this.platform.log.debug(`${this.accessory.displayName}: ParseMode success.
                deviceMode: ${deviceMode}; 
                isDeviceOn: ${isDeviceOn};`);
        })
        .catch((error) => {
            this.platform.log.error(`${this.accessory.displayName}: ParseMode error: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        });

        return isDeviceOn;
    }

    async toggleDevice() {
        await ToggleState(
            this.platform,
            this.accessory.context.deviceConfig.PROCESS_KEY_NUM,
            this.accessory.displayName)
        .then((message) => {
            this.platform.log.debug(`${this.accessory.displayName}: ToggleDeviceState success.
                message: ${message};`);
        })
        .catch((error) => {
            this.platform.log.error(`${this.accessory.displayName}: error getting device state: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        });
    }
}
