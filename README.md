# Window Controls for Foundry VTT

Allows pasting images from clipboard into Foundry VTT Tiles Layer.

### Usage

1. Copy an Image you like
    1. Right-Click + Copy Image
    2. (RECOMMENDED) take an Area Screenshot with Snipping Tool or equivalent software
2. Go to Foundry, focus on the Canvas and Press CTRL+V
3. If an Image is found in your Clipboard, it will paste the image under your mouse and switch you to the Tiles layer.

**Note:** If an image is larger than Canvas dimensions, then the image will be shrinked to 1/3 the size of the canvas,
while holding image proportions.

## DOs and DON'Ts

### 1

**AVOID LARGE IMAGES!!!** Pasting Large images with this method will impact Foundry VTT performance! Make sure you don't copy large images or better, use Screenshot Taking tools (for example WIN+SHIFT+S opens the Snipping Tool in windows)

### 2

Copy-Pasting with this module is just a convenient method to get by in the heat of the moment. I recommend, by the end of a session, to convert the copy-pasted images into appropriate uploaded images with FoundryVTT. Specially if the copy-pasted images are large or too many.

### Technichalities

Image sources are stored in Base64 within the tile properties of the tile, within the world. Most screenshot tools and browser image copying should convert to base64 by today's standards. If you have any better methods to get this done, pull requests are obviously welcome.

## Recommended With

[Minimal UI](https://github.com/saif-ellafi/foundryvtt-minimal-ui)
and [Super Select](https://github.com/saif-ellafi/foundryvtt-super-select)

## ToDo

* More Testing
* More Configurable Options

### [Invite me a coffee if you like this module :D](https://ko-fi.com/jeansenvaars)

![example](example.gif)

## By JeansenVaars

![JVLogo](logo-small-black.png)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/V7V14D3AH)

## Check out my other modules!

* Minimal UI
* Scene Preview
* Super Select

# Appreciations

* Thanks to the FoundryVTT Discord community for the amazing issue reports and feedback.

# License

[MIT License](./LICENSE.md)

# Powered By

[![JetBrains](./jetbrains.svg)](https://www.jetbrains.com)

Thanks to JetBrains I can work on this project using **WebStorm**.
