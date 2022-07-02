import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';
import { AquaConnectLitePlatform } from './platform';
import { GetDeviceState, ToggleDeviceState } from './util'
import { DEFAULT_DEVICE_INFO } from './settings';

export class Light {
    private service: Service;

    private currentState = {
        On: true,
    };

    constructor(
        private readonly platform: AquaConnectLitePlatform,
        private readonly accessory: PlatformAccessory) {

        this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.displayName);

        this.service.getCharacteristic(this.platform.Characteristic.On)
            .onSet(this.setOn.bind(this))
            .onGet(this.getOn.bind(this));
    }

    async setOn(value: CharacteristicValue) {
        let toggleDevice = false;

        // check our device state
        await GetDeviceState(
            this.platform.config,
            DEFAULT_DEVICE_INFO.LIGHT.STATUS_KEY_INDEX )
        .then( (deviceState) => {
            if ((deviceState === 'on' && this.currentState.On)
                || (deviceState === 'off' && !this.currentState.On )) {
                toggleDevice = true;
            } 
            })
        .catch( (error) => {
            console.log(`-setOn lightError: ${error}`);
            throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
        });

        if ( toggleDevice ) {
            // device is not in requested state, toggle it
            await ToggleDeviceState(
                this.platform.config,
                DEFAULT_DEVICE_INFO.LIGHT.PROCESS_KEY_NUM)
            .then((response) => {
                console.log(`-setOn response: ${response}`);
                //this.currentState.On = !this.currentState.On;
            })
            .catch( (error) => {
                console.log(`-setOn lightError: ${error}`);
            });
        }        
    }

    async getOn(): Promise<CharacteristicValue> {
        // send request to get our device state
        await GetDeviceState(
                this.platform.config,
                DEFAULT_DEVICE_INFO.LIGHT.STATUS_KEY_INDEX )
            .then( (deviceState) => {
                console.log(`lightDeviceState: ${deviceState}`)
                this.currentState.On = deviceState === 'on';
            })
            .catch( (error) => {
                console.log(`getOn lightError: ${error}`);
                throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);
            });
        return this.currentState.On;
    }
}
