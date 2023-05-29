import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, ACCESSORY_TYPE, ACCESSORIES } from './settings';
import { Light } from './light';
import { Switch } from './switch';
import { ModeSwitch } from './mode_switch';

/**
 * HomebridgePlatform
 */
export class AquaConnectLitePlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    public readonly accessories: PlatformAccessory[] = [];

    public lastRequest: number;
    public requestInProgress: boolean;
    public lastResponse: string;

    public modeToggleInProgress: boolean;
    public enabledModes: Array<ModeSwitch>;
    public currentMode: string;
    public expectedMode: string;

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API) {
        
        this.lastRequest = Date.now();
        this.requestInProgress = false;
        this.lastResponse = '';


        this.modeToggleInProgress = false;
        this.enabledModes = [];
        this.currentMode = '';
        this.expectedMode = '';

        this.api.on('didFinishLaunching', () => {
            if (!this.config.disclaimer) {
                this.log.error('Accept Disclaimer to enable this plugin.');
                return;
            }

            if (!this.config.bridge_ip_address || !this.config.include_accessories || this.config.include_accessories.length === 0) {
                this.log.error('Missing required settings. Update the settings and restart Homebridge.');
                return;
            }

            this.loadAccessories();
        });
    }

    loadAccessories() {
        for (const accessoryConfig of ACCESSORIES) {
            this.log.debug(`-------------${accessoryConfig.NAME} discover started-------------`);

            let includeAccessory = false;            
            if (this.config.include_accessories && this.config.include_accessories.includes(accessoryConfig.NAME)) {
                includeAccessory = true;
            }

            const uuid = this.api.hap.uuid.generate((PLATFORM_NAME + accessoryConfig.NAME + accessoryConfig.TYPE));
            let accessory = this.accessories.find(a => a.UUID === uuid);

            if (!includeAccessory) {
                if (accessory) {
                    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME,[accessory]);
                    this.log.debug(`${accessoryConfig.NAME} unregistered.`);
                }

                this.log.debug(`${accessoryConfig.NAME} excluded.`);
                continue;
            }

            let newAccessory = false;
            if (!accessory) {
                accessory = new this.api.platformAccessory(accessoryConfig.NAME, uuid);
                newAccessory = true;
            }

            accessory.context.deviceConfig = accessoryConfig;

            this.initializeAccessory(this, accessory, accessoryConfig.TYPE);
            
            if (!newAccessory) {
                this.api.updatePlatformAccessories([accessory]);
                this.log.debug(`${accessory.displayName} restored from cache.`);
            } else {
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                this.log.debug(`${accessory.displayName} added.`);
            }
        }            
    }

    configureAccessory(accessory: PlatformAccessory) {
        if (!this.accessories.some(a => a.UUID === accessory.UUID)) {
            this.accessories.push(accessory);
        }
    }

    initializeAccessory(platform: AquaConnectLitePlatform, accessory: PlatformAccessory, accessoryType: string) {
        switch (accessoryType) {
            case ACCESSORY_TYPE.LIGHT:
                new Light(platform, accessory);
                break;
            case ACCESSORY_TYPE.SWITCH:
                new Switch(platform, accessory);
                break;
            case ACCESSORY_TYPE.MODESWITCH: 
                this.enabledModes.push( new ModeSwitch(platform, accessory));
                break;
            default:
                break;
        }

        return;
    }
}
