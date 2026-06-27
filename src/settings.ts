import { PlatformConfig } from 'homebridge';

export const PLATFORM_NAME = 'AquaConnectLite';

export const PLUGIN_NAME = 'homebridge-aqua-connect-lite';

export const AC_API_SETTINGS = {
    PATH: '/WNewSt.htm',
    UPDATE_LOCAL_SERVER_POST_BODY: 'Update Local Server&',
    REQUEST_TIMEOUT_MS: 5000,
};

export const DEFAULT_GET_CACHE_THRESHOLD = 1000;
export const DEFAULT_GET_DELAY = 100;
export const DEFAULT_SET_DELAY = 500;

export const ACCESSORY_TYPE = {
    LIGHT: 'light',
    SWITCH: 'switch',
    MODESWITCH: 'modeswitch',
} as const;

export type AccessoryType = typeof ACCESSORY_TYPE[keyof typeof ACCESSORY_TYPE];

const ACCESSORY_NAME = {
    LIGHT: 'Pool Light',
    AUXONE: 'Aux 1',
    AUXTWO: 'Aux 2',
    HEATER: 'Heater',
    SPA: 'Spa',
    POOL: 'Pool',
    SPILLOVER: 'Spillover',
};

export const ACCESSORY_MODE = {
    POOL: 'pool',
    SPA: 'spa',
    SPILLOVER: 'spillover',
} as const;

export type AccessoryMode = typeof ACCESSORY_MODE[keyof typeof ACCESSORY_MODE];

export interface AquaConnectLitePlatformConfig extends PlatformConfig {
    disclaimer?: boolean;
    bridge_ip_address?: string;
    get_cache_threshold?: number;
    get_delay?: number;
    set_delay?: number;
    include_accessories?: string[];
}

interface BaseAccessoryConfig {
    NAME: string;
    TYPE: AccessoryType;
    PROCESS_KEY_NUM: string;
    STATUS_KEY_INDEX: number;
}

export interface ToggleAccessoryConfig extends BaseAccessoryConfig {
    TYPE: typeof ACCESSORY_TYPE.LIGHT | typeof ACCESSORY_TYPE.SWITCH;
}

export interface ModeAccessoryConfig extends BaseAccessoryConfig {
    TYPE: typeof ACCESSORY_TYPE.MODESWITCH;
    MODE: AccessoryMode;
}

export type AccessoryConfig = ToggleAccessoryConfig | ModeAccessoryConfig;

export const ACCESSORIES: AccessoryConfig[] = [
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

export const isModeAccessoryConfig = (accessoryConfig: AccessoryConfig): accessoryConfig is ModeAccessoryConfig => {
    return accessoryConfig.TYPE === ACCESSORY_TYPE.MODESWITCH;
};
