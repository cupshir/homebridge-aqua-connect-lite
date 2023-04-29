const PLATFORM_NAME = 'AquaConnectLite';

const PLUGIN_NAME = 'homebridge-aqua-connect-lite';

const AC_API_SETTINGS = {
    PATH: "/WNewSt.htm",
    UPDATE_LOCAL_SERVER_POST_BODY: 'Update Local Server&'
};

const ACCESSORY_TYPE = {
    LIGHT: 'light',
    SWITCH: 'switch',
    MODESWITCH: 'modeswitch',
};

const ACCESSORY_NAME = {
    LIGHT: 'Pool Light',
    AUXONE: 'Aux 1',
    AUXTWO: 'Aux 2',
    HEATER: 'Heater',
    SPA: 'Spa',
    POOL: 'Pool',
    SPILLOVER: 'Spillover',
};

const ACCESSORY_MODE = {
    POOL: 'pool',
    SPA: 'spa',
    SPILLOVER: 'spillover',
}

const ACCESSORIES = [
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
        NAME: ACCESSORY_NAME.SPA,
        TYPE: ACCESSORY_TYPE.MODESWITCH,
        MODE: ACCESSORY_MODE.SPA,
        PROCESS_KEY_NUM: '07',
        STATUS_KEY_INDEX: 1
    },
    {
        NAME: ACCESSORY_NAME.POOL,
        TYPE: ACCESSORY_TYPE.MODESWITCH,
        MODE: ACCESSORY_MODE.POOL,
        PROCESS_KEY_NUM: '07',
        STATUS_KEY_INDEX: 0
    },
    {
        NAME: ACCESSORY_NAME.SPILLOVER,
        TYPE: ACCESSORY_TYPE.MODESWITCH,
        MODE: ACCESSORY_MODE.SPILLOVER,
        PROCESS_KEY_NUM: '07',
        STATUS_KEY_INDEX: 2
    },
];

export { PLATFORM_NAME, PLUGIN_NAME, AC_API_SETTINGS, ACCESSORY_TYPE, ACCESSORY_MODE, ACCESSORIES}