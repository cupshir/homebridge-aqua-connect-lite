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
    AUXTHR: 'Aux 3',
    AUXFOU: 'Aux 4',
    AUXFIV: 'Aux 5',
    AUXSIX: 'Aux 6'
};

export const ACCESSORIES = [
    {
        NAME: ACCESSORY_NAME.LIGHT,
        TYPE: ACCESSORY_TYPE.LIGHT,
        PROCESS_KEY_NUM: '09',
        STATUS_KEY_INDEX: 5
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
        NAME: ACCESSORY_NAME.AUXTHR,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '0C',
        STATUS_KEY_INDEX: 12
    },
    {
        NAME: ACCESSORY_NAME.AUXFOU,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '0D',
        STATUS_KEY_INDEX: 13
    },
    {
        NAME: ACCESSORY_NAME.AUXFIV,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '0E',
        STATUS_KEY_INDEX: 14
    },
    {
        NAME: ACCESSORY_NAME.AUXSIX,
        TYPE: ACCESSORY_TYPE.SWITCH,
        PROCESS_KEY_NUM: '0F',
        STATUS_KEY_INDEX: 15
    }
];
