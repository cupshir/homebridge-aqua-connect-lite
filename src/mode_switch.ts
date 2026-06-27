import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { AquaConnectLitePlatform } from './platform';
import { ModeAccessoryConfig } from './settings';
import { ParseMode, Sleep, ToggleState } from './util';

export class ModeSwitch {
    private service: Service;

    private isOn: boolean;

    constructor(
        private readonly platform: AquaConnectLitePlatform,
        public readonly accessory: PlatformAccessory,
        private readonly modeConfig: ModeAccessoryConfig) {

        this.isOn = false;

        this.service = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch);

        this.service.setCharacteristic(this.platform.Characteristic.Name, this.accessory.displayName);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
    }

    async setOn(newState: CharacteristicValue) {
        const shouldEnable = newState === true;

        this.platform.log.debug(`---setOn-----${this.accessory.displayName} starting ModeSwitch setOn--------------`);
        this.platform.log.debug(`
            isOn: ${this.isOn};
            newState: ${shouldEnable};
            currentMode: ${this.platform.currentMode};
            modeToggleInProgress: ${this.platform.modeToggleInProgress};`);

        if (this.platform.modeToggleInProgress) {
            this.platform.log.debug(`${this.accessory.displayName}: Mode toggle in progress, setOn request ignored.
                expectedMode: ${this.platform.expectedMode};`);
            return;
        }

        if (!shouldEnable) {
            this.platform.log.debug(`${this.accessory.displayName}: New device state should be off, nothing to do.`);
            this.syncOnState(this.platform.currentMode === this.modeConfig.MODE);
            return;
        }

        if (this.platform.currentMode === this.modeConfig.MODE) {
            this.platform.log.debug(`${this.accessory.displayName}: Device already in requested mode, ignoring setOn`);
            this.syncOnState(true);
            return;
        }

        try {
            const response = await this.processSetOn();
            this.platform.log.debug(`${this.accessory.displayName}: ModeSwitch setOn success.
                ${response}`);
        } catch (error) {
            this.platform.log.error(`${this.accessory.displayName}: ModeSwitch setOn failed.
                ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
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
            return this.modeConfig.MODE === this.platform.expectedMode;
        }

        const isDeviceOn = await this.isDeviceOn();

        if (isDeviceOn) {
            this.syncOnState(true);
            this.platform.currentMode = this.modeConfig.MODE;
        } else {
            this.syncOnState(false);
        }
            
        return isDeviceOn;
    }

    async processSetOn(): Promise<string> {
        this.platform.log.debug(`---processSetOn----${this.accessory.displayName} Starting processSetOn--------------`);

        try {
            this.platform.modeToggleInProgress = true;
            this.platform.expectedMode = this.modeConfig.MODE;

            for (let attempt = 1; attempt <= 3; attempt++) {
                const isDeviceOn = await this.isDeviceOn(true);
                if (isDeviceOn) {
                    this.platform.currentMode = this.modeConfig.MODE;
                    this.syncOnState(true);

                    this.platform.enabledModes.forEach(mode => {
                        if (this.accessory.UUID !== mode.accessory.UUID) {
                            mode.syncOnState(false);
                        }
                    });

                    return `${this.accessory.displayName}: processSetOn success after ${attempt - 1} toggles.`;
                }

                this.platform.log.debug(`${this.accessory.displayName}: toggle attempt ${attempt}.
                    currentMode: ${this.platform.currentMode};`);

                await this.toggleDevice();
                await Sleep(this.platform.getSetDelay());
            }

            throw new Error(`${this.accessory.displayName}: processSetOn something failed.`);
        } finally {
            this.platform.modeToggleInProgress = false;
            this.platform.expectedMode = '';
        }
    }

    async isDeviceOn(forceRefresh = false): Promise<boolean> {
        try {
            const deviceMode = await ParseMode(this.platform, this.accessory.displayName, forceRefresh);
            this.platform.log.debug(`${this.accessory.displayName}: ParseMode success.
                deviceMode: ${deviceMode}; 
                isDeviceOn: ${this.modeConfig.MODE === deviceMode};`);

            return this.modeConfig.MODE === deviceMode;
        } catch (error) {
            this.platform.log.error(`${this.accessory.displayName}: ParseMode error: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
    }

    async toggleDevice(): Promise<void> {
        try {
            const message = await ToggleState(
                this.platform,
                this.modeConfig.PROCESS_KEY_NUM,
                this.accessory.displayName,
            );
            this.platform.log.debug(`${this.accessory.displayName}: ToggleDeviceState success.
                message: ${message};`);
        } catch (error) {
            this.platform.log.error(`${this.accessory.displayName}: ToggleDeviceState failed: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        }
    }

    public syncOnState(isOn: boolean) {
        this.isOn = isOn;
        this.service.updateCharacteristic(this.platform.Characteristic.On, isOn);
    }
}
