async function _clipboardCreateFolderIfMissing(folderPath) {
    let source = "data";
    if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
        source = "forgevtt";
    }
    try {
        await FilePicker.browse(source, folderPath);
    } catch (error) {
        await FilePicker.createDirectory(source, folderPath);
    }
}

function _clipboardGetSource() {
    let source = "data";
    if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
        source = "forgevtt";
    }
    return source;
}

function _clipboardGetImageSizeFast(img, callback) {
    const wait = setInterval(function () {
        const w = img.width, h = img.height;
        if (w && h) {
            clearInterval(wait);
            img.src = '';
            callback.apply(this, [w, h]);
        }
    }, 10);
}

let CLIPBOARD_IMAGE_LOCKED = false;
let CLIPBOARD_HIDDEN_MODE = false;

document.addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.getModifierState('CapsLock'))
        CLIPBOARD_HIDDEN_MODE = true
    else
        CLIPBOARD_HIDDEN_MODE = false;
});

Hooks.once('ready', async function () {

    game.settings.register('clipboard-image', 'image-location', {
        name: 'Pasted image location',
        hint: 'Folder where to save copy-pasted images. Default: pasted_images',
        scope: 'world',
        config: true,
        type: String,
        default: "pasted_images",
        onChange: async function (newPath) {
            if (game.user.isGM) {
                await _clipboardCreateFolderIfMissing(newPath);
            }
        }
    });

    if (game.user.isGM) {

        await _clipboardCreateFolderIfMissing(game.settings.get('clipboard-image', 'image-location'));

        document.onpaste = function (pasteEvent) {

            if (CLIPBOARD_IMAGE_LOCKED) return;

            const items = pasteEvent.clipboardData.items;
            let item;
            for (let idx = 0; idx < items.length; idx++) {
                if (items[idx].kind === "file") {
                    item = items[idx];
                    break;
                }
            }

            if (item) {
                if (canvas.activeLayer._copy.length) {
                    console.warn("Image Clipboard: Priority given to Foundry copied objects. Ctrl+C on empty space to clear clipboard.");
                    return;
                }

                game.canvas.getLayer("BackgroundLayer").activate();
                const mousePos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.stage);

                if (document.activeElement !== $(".game")[0] ||
                    mousePos.x < 0 || mousePos.y < 0 ||
                    mousePos.x > canvas.dimensions.width || mousePos.y > canvas.dimensions.height) return;

                CLIPBOARD_IMAGE_LOCKED = true;
                const blob = item.getAsFile();

                const reader = new FileReader();
                reader.onload = async function () {

                    const filename = "pasted_image_" + Date.now() + ".png";
                    const file = new File([blob], filename, {type: item.type});
                    const targetFolder = game.settings.get('clipboard-image', 'image-location');
                    const path = (await FilePicker.upload(_clipboardGetSource(), targetFolder, file, {})).path;

                    const curDims = game.scenes.active.dimensions
                    let image = new Image()
                    image.src = path;
                    image.onerror = function () {
                        CLIPBOARD_IMAGE_LOCKED = false
                    };
                    _clipboardGetImageSizeFast(image, async function (imgWidth, imgHeight) {
                        const origWidth = imgWidth;

                        if (imgHeight > curDims.sceneHeight || imgWidth > curDims.sceneWidth) {
                            imgWidth = curDims.sceneWidth / 3;
                            imgHeight = imgWidth * imgHeight / origWidth;
                        }

                        let newTile = [{
                            img: path,
                            width: imgWidth,
                            height: imgHeight,
                            scale: 1,
                            x: mousePos.x,
                            y: mousePos.y,
                            z: 0,
                            rotation: 0,
                            hidden: CLIPBOARD_HIDDEN_MODE,
                            locked: false,
                        }];
                        await canvas.scene.createEmbeddedDocuments("Tile", newTile);
                        CLIPBOARD_IMAGE_LOCKED = false;
                    });
                };
                reader.readAsDataURL(blob);
            }
        }

    }

});