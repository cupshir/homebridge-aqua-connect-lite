import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, ACCESSORY_TYPE, ACCESSORIES } from './settings';
import { Light } from './light';
import { Switch } from './switch';
import { Temperature } from './temperature';

/**
 * HomebridgePlatform
 */
export class AquaConnectLitePlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API) {
        
        this.api.on('didFinishLaunching', () => {
            this.discoverAccessories();
        });
    }

    configureAccessory(accessory: PlatformAccessory) {
        if (!this.accessories.some(a => a.UUID === accessory.UUID)) {
            this.accessories.push(accessory);
        }
    }

    discoverAccessories() {
        for (const accessory of ACCESSORIES) {
            this.log.debug('---------------------------');
            this.log.debug(`${accessory.NAME} discover started.`);

            let excludeAccessory = false;            
            if (this.config.exclude_accessories && this.config.exclude_accessories.includes(accessory.NAME)) {
                excludeAccessory = true;
            }

            const uuid = this.api.hap.uuid.generate((PLATFORM_NAME + accessory.NAME + accessory.TYPE));
            const existingAccessory = this.accessories.find(a => a.UUID === uuid);

            if (existingAccessory) {
                // if an accessory was included previously, but now excluded
                // we need to remove it from the platform
                if (excludeAccessory) {
                    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME,[existingAccessory]);

                    this.log.debug(`${accessory.NAME} excluded and unregistered.`);

                    // skip to next accessory
                    continue;
                }

                existingAccessory.context.device = accessory;        
                this.api.updatePlatformAccessories([existingAccessory]);

                this.initializeAccessory(this, existingAccessory, accessory.TYPE)

                this.log.debug(`${existingAccessory.displayName} restored from cache.`);
            } else {
                if (excludeAccessory) {
                    this.log.debug(`${accessory.NAME} excluded.`);

                    // skip to next accessory
                    continue;
                }
        
                const newAccessory = new this.api.platformAccessory(accessory.NAME, uuid);
                newAccessory.context.device = accessory;

                this.initializeAccessory(this, newAccessory, accessory.TYPE)
        
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [newAccessory]);

                this.log.debug(`${accessory.NAME} added.`);
            }  
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
            case ACCESSORY_TYPE.TEMPERATURE:
                new Temperature(platform, accessory);
                break;
            default:
                break;
        }

        return;
    }
}
