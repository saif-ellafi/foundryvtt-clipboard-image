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

async function _extractFromClipboard() {
  let clipItems;
  try {
    clipItems = await navigator.clipboard.read();
  } catch (error) {
    if (!error) {
      console.warn('Failed to parse clipboard. Make sure your browser supports the navigator API');
    } else if (error instanceof DOMException) {
      console.log('image-clipboard: Clipboard is empty');
    } else
      throw error;
  }
  return clipItems;
}

async function _extractBlob(clipItems) {
  let blob;
  for (let idx = 0; idx < clipItems[0].types.length; idx++) {
    const ftype = clipItems[0].types[idx];
    if (ftype.startsWith("image/")) {
      blob = await clipItems[0].getType(ftype);
      break;
    }
  }
  return blob;
}

function _pasteBlob(blob) {
  game.canvas.tiles.activate();
  const mousePos = canvas.app.renderer.events.pointer.getLocalPosition(canvas.stage);

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
  if (navigator.clipboard?.read) {
    game.keybindings.register("clipboard-image", "paste-image", {
      name: "Paste Image from Clipboard",
      restricted: true,
      uneditable: [
        {key: "KeyV", modifiers: [ KeyboardManager.MODIFIER_KEYS.CONTROL ]}
      ],
      onDown: () => {
        let succeeded = false;
        if (canvas.activeLayer._copy.length) {
          console.warn("Image Clipboard: Priority given to Foundry copied objects.");
          return succeeded;
        }
        if (CLIPBOARD_IMAGE_LOCKED) return succeeded;
        if (game.modules.get('vtta-tokenizer')?.active &&
            Object.values(ui.windows).filter(w => w.id === 'tokenizer-control').length)
              return succeeded;
        _extractFromClipboard().then((clipItems) => {
          if (clipItems?.length) {
            _clipboardCreateFolderIfMissing(game.settings.get('clipboard-image', 'image-location')).then(() => {
              _extractBlob(clipItems).then((blob) => {
                if (blob) {
                  _pasteBlob(blob);
                  succeeded = true
                }
              });
            });
          }
        });
        return succeeded;
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
      filePicker: 'folder'
    });
  }

});

Hooks.once('ready', function() {
  if (game.user.isGM && !navigator.clipboard?.read) {
    ui.notifications.warn("Clipboard Image: Disabled - Your browser does not support clipboard functions. Please check the console");
    console.warn("Clipboard Image was not initialized. Either this hostname is missing certificates or if you are on Firefox: I need dom.events.asyncClipboard.read and dom.events.testing.asyncClipboard browser functions enabled. Or try with any Chromium based browser");
  }
});