import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME, DEFAULT_DEVICE_INFO } from './settings';
import { Light } from './light';
import { Aux1 } from './aux1'

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class AquaConnectLitePlatform implements DynamicPlatformPlugin {
    public readonly Service: typeof Service = this.api.hap.Service;
    public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

    // this is used to track restored cached accessories
    public readonly accessories: PlatformAccessory[] = [];

    constructor(
        public readonly log: Logger,
        public readonly config: PlatformConfig,
        public readonly api: API,
    ) {
        this.log.debug('Finished initializing platform:', this.config.name);
        
        this.api.on('didFinishLaunching', () => {
            // run the method to discover / register your devices as accessories
            this.discoverDevices();
        });
    }

    configureAccessory(accessory: PlatformAccessory) {
        this.log.info('Loading accessory from cache:', accessory.displayName);

        // add the restored accessory to the accessories cache so we can track if it has already been registered
        if (!this.accessories.some( a => a.UUID === accessory.UUID)){
            this.accessories.push(accessory);
        }
    }

    /**
     * This is an example method showing how to register discovered accessories.
     * Accessories must only be registered once, previously created accessories
     * must not be registered again to prevent "duplicate UUID" errors.
     */
    discoverDevices() {

        if (!this.config.accessories) {
            // no accessories configured, nothing to do
            // TODO
            // probably show error message or something
            return;
        }

        // loop over the devices and register each one if it has not already been registered
        for (let i = 0; i < this.config.accessories.length; i++) {
            const device = this.config.accessories[i];

            console.log(`${i} - device name: ${device.name}`);
            console.log(`${i} - device type: ${device.deviceType}`);

            // generate a unique id
            // adding the array index to ensure we get a unique uuid
            const uuid = this.api.hap.uuid.generate((device.name + device.deviceType + i));

            // see if an accessory with the same uuid has already been registered 
            const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

            if (existingAccessory) {
                // the accessory already exists
                this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
        
                // update the accessory.context then run `api.updatePlatformAccessories`
                existingAccessory.context.device = device;
                this.api.updatePlatformAccessories([existingAccessory]);
        
                // create the accessory handler for the restored accessory
                switch (device.deviceType) {
                    case DEFAULT_DEVICE_INFO.LIGHT.DEVICE_TYPE:
                        new Light(this, existingAccessory);
                        break;
                    case DEFAULT_DEVICE_INFO.AUX1.DEVICE_TYPE:
                        new Aux1(this, existingAccessory);
                        break;
                    default:
                        break;
                }
        
                // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
                // remove platform accessories when no longer present
                //this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
                //this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
            } else {
                // the accessory does not yet exist, so we need to create it
                this.log.info('Adding new accessory:', device.name);
        
                // create a new accessory
                const accessory = new this.api.platformAccessory(device.name, uuid);
        
                // store a copy of the device object in the `accessory.context`
                // the `context` property can be used to store any data about the accessory you may need
                accessory.context.device = device;
        
                // create the accessory handler for the newly create accessory
                // this is imported from `platformAccessory.ts`
                switch (device.deviceType) {
                    case DEFAULT_DEVICE_INFO.LIGHT.DEVICE_TYPE:
                        new Light(this, accessory);
                        break;
                    case DEFAULT_DEVICE_INFO.AUX1.DEVICE_TYPE:
                        new Aux1(this, accessory);
                        break;
                    default:
                        break;
                }
        
                // link the accessory to your platform
                this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
            }      
        } 
    }
}
