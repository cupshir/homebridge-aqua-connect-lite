import { API } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { AquaConnectLitePlatform } from './platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  (api.registerPlatform as any).call(api, PLUGIN_NAME, PLATFORM_NAME, AquaConnectLitePlatform);
};
