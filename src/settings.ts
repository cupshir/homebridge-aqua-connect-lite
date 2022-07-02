/**
 * This is the name of the platform that users will use to register the plugin in the Homebridge config.json
 */
export const PLATFORM_NAME = 'AquaConnectLite';

/**
 * This must match the name of your plugin as defined the package.json
 */
export const PLUGIN_NAME = 'homebridge-aqua-connect-lite';

export const ACL_API_SETTINGS = {
    UPDATE_LOCAL_SERVER_POST_BODY: 'Update Local Server&'
}

export const DEFAULT_DEVICE_INFO = {
    LIGHT: {
        DEVICE_NAME: 'Pool Light',
        DEVICE_TYPE: 'light',
        PROCESS_KEY_NUM: '09',
        STATUS_KEY_INDEX: 4
    },
    AUX1: {
        DEVICE_NAME: 'Aux 1',
        DEVICE_TYPE: 'aux1',
        PROCESS_KEY_NUM: '0A',
        STATUS_KEY_INDEX: 9
    }
};