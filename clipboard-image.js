async function clipboardCreateFolderIfMissing(folderPath) {
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

function clipboardGetSource() {

  let source = "data";
  if (typeof ForgeVTT != "undefined" && ForgeVTT.usingTheForge) {
    source = "forgevtt";
  }
  return source;

}

Hooks.once('ready', async function () {

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  game.settings.register('clipboard-image', 'image-location', {
    name: 'Pasted image location',
    hint: 'Folder where to save copy-pasted images. Default: pasted_images',
    scope: 'world',
    config: true,
    type: String,
    default: "pasted_images",
    onChange: async function (newPath) {
      if (game.user.isGM) {
        await clipboardCreateFolderIfMissing(newPath);
      }
    }
  });

  if (game.user.isGM) {

    await clipboardCreateFolderIfMissing(game.settings.get('clipboard-image', 'image-location'));

    document.onpaste = function (pasteEvent) {


      const items = pasteEvent.clipboardData.items;
      let item;
      for (let idx = 0; idx < items.length; idx++) {
        if (items[idx].kind === "file") {
          item = items[idx];
          break;
        }
      }

      if (item) {
        const blob = item.getAsFile();

        const reader = new FileReader();
        reader.onload = async function (event) {

          const filename = "pasted_image_" + Date.now() + ".png";
          const file = new File([blob], filename, {type: item.type});
          const targetFolder = game.settings.get('clipboard-image', 'image-location');
          const path = targetFolder + "/" + filename;
          await FilePicker.upload(clipboardGetSource(), targetFolder, file, {});

          const curDims = game.scenes.active.dimensions
          let image = new Image()
          let imgWidth;
          let imgHeight;
          image.src = path;
          await sleep(100);

          if (image.height > curDims.sceneHeight || image.width > curDims.sceneWidth) {
            imgWidth = curDims.sceneWidth / 3;
            imgHeight = imgWidth * image.height / image.width;
          } else {
            imgHeight = image.height;
            imgWidth = image.width;
          }

          image = null;

          game.canvas.getLayer("BackgroundLayer").activate();
          const mousePos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.stage);

          let newTile = [{
            img: path,
            width: imgWidth,
            height: imgHeight,
            scale: 1,
            x: mousePos.x,
            y: mousePos.y,
            z: 0,
            rotation: 0,
            hidden: false,
            locked: false,
          }];
          await canvas.scene.createEmbeddedDocuments("Tile", newTile);
        };

        reader.readAsDataURL(blob);
      }
    }

  }

});