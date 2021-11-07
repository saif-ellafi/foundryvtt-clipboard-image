Hooks.once('ready', async function () {

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  if (game.user.isGM) {

    document.onpaste = function (pasteEvent) {

      const items = pasteEvent.clipboardData.items;
      let item;
      for(let idx=0;idx<items.length;idx++) {
        if(items[idx].kind==="file") {
          item = items[idx];
          break;
        }
      }

      if (item) {
        const blob = item.getAsFile();

        const reader = new FileReader();
        reader.onload = async function (event) {

          let image = new Image();
          image.src = event.target.result.toString();
          await sleep(100); // give time for image to load?

          const curDims = game.scenes.active.dimensions
          let imgWidth;
          let imgHeight;
          if (image.height > curDims.sceneHeight || image.width > curDims.sceneWidth) {
            imgWidth = curDims.sceneWidth / 3;
            imgHeight = imgWidth * image.height / image.width;
          } else {
            imgHeight = image.height;
            imgWidth = image.width;
          }

          game.canvas.getLayer("BackgroundLayer").activate();
          const mousePos = canvas.app.renderer.plugins.interaction.mouse.getLocalPosition(canvas.stage);

          let newTile = [{
            img: event.target.result.toString(),
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