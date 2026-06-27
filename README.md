# homebridge-aqua-connect-lite
Control your Hayward pool equipment with Aqua Connect Home Network via Homebridge.

This plugin talks to the local Aqua Connect Lite web interface and mirrors a subset of the panel controls into Apple Home. The protocol was reverse engineered from the built-in web UI, so behavior may vary across controller models and firmware revisions.

My pool hardware setup is a Hayward E-Command 4, Pro Logic P4, and an Aqua Connect Home Network Device.

The revived `feature-spa-heater-functionality` branch currently supports:

- Pool Light
- Aux 1
- Aux 2
- Heater
- Pool mode
- Spa mode
- Spillover mode

## Requirements

- Node.js 18, 20, or 22
- Homebridge 1.8+ or Homebridge 2.0 beta

## Installation

### With Homebridge UI
Search for:

```text
Aqua Connect Lite
```

Then click `INSTALL`.

### With npm

```bash
npm install homebridge-aqua-connect-lite
```

## Configuration

### With Homebridge UI

1. Accept the disclaimer.
2. Enter your Aqua Connect Lite bridge IP address.
3. Select the accessories you want to expose.
4. Optionally tune the request timings if your bridge is slow to respond:
   `get_cache_threshold`, `get_delay`, and `set_delay`.

### With `config.json`

Add this to the `platforms` array:

```json
{
  "platform": "AquaConnectLite",
  "disclaimer": true,
  "bridge_ip_address": "xxx.xxx.xxx.xxx",
  "get_cache_threshold": 1000,
  "get_delay": 100,
  "set_delay": 500,
  "include_accessories": [
    "Pool Light",
    "Aux 1",
    "Aux 2"
  ]
}
```

Available accessories:

- `Pool Light`
- `Aux 1`
- `Aux 2`
- `Heater`
- `Pool`
- `Spa`
- `Spillover`

## Troubleshooting

This plugin assumes the reverse-engineered key indexes and process keys are consistent across Aqua Connect Lite / Pro Logic combinations. If your controller uses different mappings, the plugin may not work correctly or may toggle the wrong function. If that happens, open an issue at [GitHub](https://github.com/cupshir/homebridge-aqua-connect-lite/issues) with your hardware details.
