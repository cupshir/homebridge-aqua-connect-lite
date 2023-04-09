export const PLATFORM_NAME = 'AquaConnectLite';

export const PLUGIN_NAME = 'homebridge-aqua-connect-lite';

export const AC_API_SETTINGS = {
    PATH: "/WNewSt.htm",
    UPDATE_LOCAL_SERVER_POST_BODY: 'Update Local Server&'
};

export const ACCESSORY_TYPE = {
    LIGHT: 'light',
    SWITCH: 'switch'
};

const ACCESSORY_NAME = {
    LIGHT: 'Pool Light',
    AUXONE: 'Aux 1',
    AUXTWO: 'Aux 2',
    HEATER: 'Heater',
    SPAMODE: 'Spa Mode'
};

export const ACCESSORIES = [
    {
        NAME: ACCESSORY_NAME.LIGHT,
        TYPE: ACCESSORY_TYPE.LIGHT,
        PROCESS_KEY_NUM: '09',
        STATUS_KEY_INDEX: 4
    },
    {
        NAME: ACCESSORY_NAME.AUXONE,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '0A',
        STATUS_KEY_INDEX: 9
    },
    {
        NAME: ACCESSORY_NAME.AUXTWO,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '0B',
        STATUS_KEY_INDEX: 10
    },
    {
        NAME: ACCESSORY_NAME.HEATER,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '13',
        STATUS_KEY_INDEX: 6
    },
    {
        NAME: ACCESSORY_NAME.SPAMODE,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '07',
        STATUS_KEY_INDEX: 1
    {
];
