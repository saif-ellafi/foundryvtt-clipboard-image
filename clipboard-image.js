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

async function _processClipboard(items) {
    await _clipboardCreateFolderIfMissing(game.settings.get('clipboard-image', 'image-location'));


    if (CLIPBOARD_IMAGE_LOCKED) return;

    let blob;
    for (let idx = 0; idx < items.length; idx++) {
        const ftype = items[idx].types[0];
        if (ftype.startsWith("image/")) {
            blob = await items[idx].getType(ftype);
            break;
        }
    }
    if (blob) _pasteBlob(blob);
}

function _pasteBlob(blob) {
    if (canvas.activeLayer._copy.length) {
        console.warn("Image Clipboard: Priority given to Foundry copied objects. Ctrl+C on empty space to clear clipboard.");
        return;
    }

    game.canvas.background.activate();
    const mousePos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.stage);

    if (document.activeElement !== $(".game")[0] ||
      mousePos.x < 0 || mousePos.y < 0 ||
      mousePos.x > canvas.dimensions.width || mousePos.y > canvas.dimensions.height) return;

    CLIPBOARD_IMAGE_LOCKED = true;

    const reader = new FileReader();
    reader.onload = async function () {

        const filename = "pasted_image_" + Date.now() + ".png";
        const file = new File([blob], filename, {type: blob.type});
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

let CLIPBOARD_IMAGE_LOCKED = false;
let CLIPBOARD_HIDDEN_MODE = false;

document.addEventListener("keydown", event => {
    CLIPBOARD_HIDDEN_MODE = (event.ctrlKey || event.metaKey) && event.getModifierState('CapsLock');
});

Hooks.once('init', function() {
    game.keybindings.register("clipboard-image", "paste-image", {
        name: "Paste Image from Clipboard",
        restricted: true,
        uneditable: [
            {key: "V", modifiers: [ "CONTROL" ]}
        ],
        onDown: async (context) => {
            let clipItems;
            if (game.user.isGM) {
                try {
                    clipItems = await navigator.clipboard.read();
                } catch (error) {
                    if (error instanceof DOMException)
                        console.log('image-clipboard: Clipboard is empty');
                    else
                        throw error;
                }
                if (clipItems)
                    _processClipboard(clipItems);
            }
        },
        precedence: CONST.KEYBINDING_PRECEDENCE.PRIORITY
    });

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

});