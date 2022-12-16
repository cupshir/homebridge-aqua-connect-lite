# homebridge-aqua-connect-lite
Control your Hayward pool equipment with Aqua Connect Home Network via Homebridge!

I spent some time analyzing the Aqua Connect Home Network Device web app and determined that I could expose some basic funtionality to Homebridge. This is my first Homebridge plugin. While it has been working great for my setup, I cannot guarentee it will work for yours.

My pool hardware setup is a Hayward E-Command 4, Pro Logic P4, and an Aqua Connect Home Network Device. 

The next iteration will add support for the pool and air temperatures. Controlling the filter is also on the road map, eventually.  I do not have a spa or heater, so there is no plan to add support for those since I can not test them. 

Also, there is no plan to expose navigating the menu's to change settings on the controller.  I just want to be able to turn on/off my pool light with my landscape lights and control my water feature via Homebridge :-).

### This plugin requires Homebridge
Ensure you have Homebridge installed and running before trying to use this plugin.  Refer to the [Homebridge wiki](https://github.com/homebridge/homebridge/wiki) for setup instructions.

## Steps to Install Plugin 
#### With Homebridge UI
Search Plugins for

```
Aqua Connect Lite
```

And click "INSTALL"

#### Without Homebridge UI via NPM
```
npm install homebridge-aqua-connect-lite
```

## How to configure the plugin 
#### With Homebridge UI
The only required configuration needed is adding your Aqua Connect Home Network device's ip address in the plugin settings.

Optionally, you can control which devices are exposed to Homebridge by excluding what you don't want added.

When you install the plugin, settings should open automatically for you, but if it does not go to the "Plugins" tab and click "SETTINGS" link for the Aqua Connect Lite plugin.

#### Without Homebridge UI
Add this...

```
{
    "bridge_ip_address": "xxx.xxx.xxx.xxx",
    "exclude_accessories": [
    ],
    "platform": "AquaConnectLite"
}
```

to your Homebridge config.json in the "platforms" array.

To exclude accessories, enter the accessory name in the exclude_accessories array

```
"exclude_accessories": [
    "Aux 1",
    "Aux 2"
]
```
Accessories available for exclusion are...

"Pool Light",
"Aux 1",
"Aux 2"

## Troubleshooting
Im making a bit of an assumption that the key indexes and web process key's are the same across all Pro Logic P4 controllers connected to Aqua Connect. If these settings are not the same, it will cause the plugin to behave unexpectedly and either not work or turn on and off incorrect pool functions. If this happens in your setup, open an issue [here.](https://github.com/cupshir/homebridge-aqua-connect-lite/issues) and I will add in some override settings.