# homebridge-aqua-connect-lite
Control your Haywared pool equipment with Aqua Connect Home Network via Homebridge!

I spent some time analyzing the Aqua Connect Home Network Device web app and determined that I could expose some basic funtionality to Homebridge. This is my first Homebridge plugin. While it has been working great for my setup, I cannot guarentee it will work for yours.

My pool hardware setup is a Hayward E-Command 4, Pro Logic P4, and an Aqua Connect Home Network Device. 

The first iteration of this plugin will only offer support for controlling the pool light.  The next iteration will add support for the filter, aux1, and aux2.  I do not have a spa or heater, so there is no plan to add support for those since I can not test them.

Also, there is no plan to expose navigating the menu's to change settings on the controller.  I just want to be able to turn on/off my pool light and eventually my water feature with my landscape lights via Homebridge :-).

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
The only configuration needed is adding your Aqua Connect Home Network device's ip address in the plugin settings.

When you install the plugin, settings should open automatically for you, but if it does not go to the "Plugins" tab and click "SETTINGS" link for the Aqua Connect Lite plugin.

#### Without Homebridge UI
Add this...

```
{
    "bridge_ip_address": "xxx.xxx.xxx.xxx",
    "platform": "AquaConnectLite"
}
```

to your Homebridge config.json in the "platforms" array.

## Troubleshooting
Im making a bit of an assumption that the key indexes and web process key's are the same across all Pro Logic P4 controllers connected to Aqua Connect. If these settings are not the same, it will cause the plugin to behave unexpectedly and either not work or turn on and off incorrect pool functions. If this happens in your setup, open an issue [here.](https://github.com/cupshir/homebridge-aqua-connect-lite/issues) and I will add in some override settings.