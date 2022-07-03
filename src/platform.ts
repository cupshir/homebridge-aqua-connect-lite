import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, DEFAULT_DEVICE_INFO } from './settings';
import { Light } from './light';

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
        this.log.debug('Finished initializing platform:', this.config.name);
        
        this.api.on('didFinishLaunching', () => {
            this.discoverDevices();
        });
    }

    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);

        if (!this.accessories.some(a => a.UUID === accessory.UUID)) {
            this.accessories.push(accessory);
        }
    }

    discoverDevices() {
        const deviceName = DEFAULT_DEVICE_INFO.LIGHT.DEVICE_NAME;
        const deviceType = DEFAULT_DEVICE_INFO.LIGHT.DEVICE_TYPE;

        // generate a unique id
        const uuid = this.api.hap.uuid.generate((PLATFORM_NAME + deviceName + deviceType));

        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

        if (existingAccessory) {
            // the accessory already exists
            this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
    
            this.api.updatePlatformAccessories([existingAccessory]);
    
            new Light(this, existingAccessory);
        } else {
            // the accessory does not yet exist, so we need to create it
            this.log.info('Adding new accessory:', deviceName);
    
            // create a new accessory
            const accessory = new this.api.platformAccessory(deviceName, uuid);
    
            new Light(this, accessory);
    
            this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }              
    }
}
