***currently broken. Built on wrong version of node...oops. will remove this once its fixed

# homebridge-aqua-connect-lite

Control your Haywared pool equipment with Aqua Connect Home Network via Homebridge!

I spent some time analyzing the Aqua Connect Home Network Device web app and determined that I could expose some basic funtionality to Homebridge. This is my first Homebridge plugin. While it has been working great for my setup, I cannot guarentee it will work for yours.

My pool hardware setup is a Hayward E-Command 4, Pro Logic P4, and an Aqua Connect Home Network Device. 

The first iteration of this plugin will only offer support for controlling the pool light.  The next iteration will add support for the filter, aux1, and aux2.  I do not have a spa or heater, so there is no plan to add support for those since I can not test them.

Also, there is no plan to expose navigating the menu's to change settings on the controller.  I just want to be able to turn on/off my pool light and eventually my water feature with my landscape lights via Homebridge :-).

## Steps to Install

Search Plugins in the Homebridge UI and click install.

## How to configure the plugin

The only configuration needed is adding your Aqua Connect Home Network device's ip address in the plugin settings.

#### Troubleshooting

Im making a bit of an assumption that the key index and web process key are the same across all Pro Logic P4 controllers connected to Aqua Connect. If these settings are not the same, it will cause the plugin to behave unexpectedly and either not work or turn on and off incorrect pool functions. If this happens in your setup, open an issue [here.](https://github.com/cupshir/homebridge-aqua-connect-lite/issues). I will add in some override settings.