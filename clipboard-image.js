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
                    const path = (await FilePicker.upload(_clipboardGetSource(), targetFolder, file, {})).path;

                    const curDims = game.scenes.active.dimensions
                    let image = new Image()
                    image.src = path;
                    image.onload = async function () {
                        let imgWidth = this.width;
                        let imgHeight = this.height;

                        if (imgHeight > curDims.sceneHeight || imgWidth > curDims.sceneWidth) {
                            imgWidth = curDims.sceneWidth / 3;
                            imgHeight = imgWidth * imgHeight / this.width;
                        }

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
                };
                reader.readAsDataURL(blob);
            }
        }

    }

});