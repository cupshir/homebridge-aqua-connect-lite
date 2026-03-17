import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, Service, Characteristic } from 'homebridge';

import {
    PLATFORM_NAME,
    PLUGIN_NAME,
    ACCESSORY_TYPE,
    ACCESSORIES,
    AccessoryConfig,
    AccessoryMode,
    AquaConnectLitePlatformConfig,
    DEFAULT_GET_CACHE_THRESHOLD,
    DEFAULT_GET_DELAY,
    DEFAULT_SET_DELAY,
} from './settings';
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

    public requestQueue: Promise<void>;
    public lastRequestAt: number;
    public lastResponseAt: number;
    public lastResponse: string;
    public pendingRefresh?: Promise<string>;

    public modeToggleInProgress: boolean;
    public enabledModes: ModeSwitch[];
    public currentMode: AccessoryMode | '';
    public expectedMode: AccessoryMode | '';

    constructor(
        public readonly log: Logger,
        public readonly config: AquaConnectLitePlatformConfig,
        public readonly api: API) {

        this.requestQueue = Promise.resolve();
        this.lastRequestAt = 0;
        this.lastResponseAt = 0;
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

            if (!this.config.bridge_ip_address || this.getIncludedAccessories().length === 0) {
                this.log.error('Missing required settings. Update the settings and restart Homebridge.');
                return;
            }

            this.loadAccessories();
        });
    }

    public getGetDelay(): number {
        return Math.max(0, this.config.get_delay ?? DEFAULT_GET_DELAY);
    }

    public getSetDelay(): number {
        return Math.max(0, this.config.set_delay ?? DEFAULT_SET_DELAY);
    }

    public getGetCacheThreshold(): number {
        return Math.max(0, this.config.get_cache_threshold ?? DEFAULT_GET_CACHE_THRESHOLD);
    }

    private getIncludedAccessories(): string[] {
        return this.config.include_accessories ?? [];
    }

    loadAccessories() {
        this.enabledModes = [];

        for (const accessoryConfig of ACCESSORIES) {
            this.log.debug(`-------------${accessoryConfig.NAME} discover started-------------`);

            const includeAccessory = this.getIncludedAccessories().includes(accessoryConfig.NAME);

            const uuid = this.api.hap.uuid.generate((PLATFORM_NAME + accessoryConfig.NAME + accessoryConfig.TYPE));
            let accessory = this.accessories.find(a => a.UUID === uuid);

            if (!includeAccessory) {
                if (accessory) {
                    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
                    this.removeCachedAccessory(accessory);
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
            this.initializeAccessory(accessory, accessoryConfig);
            
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

    private removeCachedAccessory(accessory: PlatformAccessory) {
        const accessoryIndex = this.accessories.findIndex(a => a.UUID === accessory.UUID);
        if (accessoryIndex >= 0) {
            this.accessories.splice(accessoryIndex, 1);
        }
    }

    private initializeAccessory(accessory: PlatformAccessory, accessoryConfig: AccessoryConfig) {
        switch (accessoryConfig.TYPE) {
            case ACCESSORY_TYPE.LIGHT:
                new Light(this, accessory);
                break;
            case ACCESSORY_TYPE.SWITCH:
                new Switch(this, accessory);
                break;
            case ACCESSORY_TYPE.MODESWITCH: {
                const modeSwitch = new ModeSwitch(this, accessory, accessoryConfig);
                this.enabledModes.push(modeSwitch);
                break;
            }
            default:
                break;
        }
    }
}
