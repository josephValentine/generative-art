"use strict";
// ---------config--------------

// HUE SHiFTS: will duplicate the images with 6 hue shifted versions
const applyHueShifts = true
//const applyHueShifts = false

// FILTERS: applys specified filters in order (does not create a new image for each filter)
// available filters are here: https://silvia-odwyer.github.io/pixels.js/
// const filters = []
const filters = ["ryo", "extra_offset_red"]


//------------------------------



const path = require("path");
const isLocal = typeof process.pkg === "undefined";
const basePath = isLocal ? process.cwd() : path.dirname(process.execPath);
const fs = require("fs");
const { createCanvas, loadImage } = require(path.join(
  basePath,
  "/node_modules/canvas"
));
const buildDir = path.join(basePath, "/build");
const layersDir = path.join(basePath, "/layers");
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
} = require(path.join(basePath, "/src/config.js"));
const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
const PixelsJS = require("./Pixels");


if (fs.existsSync(buildDir)) {
  fs.rmSync(buildDir, { recursive: true, force: true });
}
fs.mkdirSync(buildDir);
fs.mkdirSync(path.join(buildDir, "/json"));
fs.mkdirSync(path.join(buildDir, "/images"));

const saveImage = (_editionCount, hue) => {
  applyHueShift(hue);
  for (let filter of filters) {
    applyFilter(filter);
  }
  fs.writeFileSync(
    `${buildDir}/images/${_editionCount}#100.png`,
    canvas.toBuffer("image/png")
  );
};

const drawElement = (loadedImage) => {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(loadedImage, 0, 0, format.width, format.height);
};

function applyFilter(filter) {
  
  let newImgData = PixelsJS.filterImgData(ctx.getImageData(0, 0, canvas.width, canvas.height), filter);
  ctx.putImageData(newImgData, 0, 0);

}

async function dewit() {
  const files = fs.readdirSync(`joeiscool`)
  .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
  .map((i, index) => {
    return {
      id: index,
      filename: i,
      path: `joeiscool/${i}`
    }
  });  
  
  let i = 0;

  // const hues = [0, 10, 20];
  // const hues = [0, 240, 300];

  const hues = applyHueShifts ? [0, 60, 120, 180, 240, 300] : [0];
  for (let hue of hues) {
    for (let file of files) {
      i+=1;
      ctx.clearRect(0, 0, format.width, format.height);
      const image = await loadImage(`${file.path}`)

      
      drawElement(image);
      saveImage(`${i}-${hue}`, hue);
    }
  }
  
}


function applyHueShift(passedIn) {
      // adjust hue
      // const hueshifts=[0, 50, 100, 150, 200];
      // const rand = Math.floor(Math.random() * hueshifts.length);
      
      const deg = Math.PI / 180;

    function rotateRGBHue(r, g, b, hue) {
      const cosA = Math.cos(hue * deg);
      const sinA = Math.sin(hue * deg);
      const neo = [
        cosA + (1 - cosA) / 3,
        (1 - cosA) / 3 - Math.sqrt(1 / 3) * sinA,
        (1 - cosA) / 3 + Math.sqrt(1 / 3) * sinA,
      ];
      const result = [
        r * neo[0] + g * neo[1] + b * neo[2],
        r * neo[2] + g * neo[0] + b * neo[1],
        r * neo[1] + g * neo[2] + b * neo[0],
      ];
      return result.map(x => uint8(x));
    }

    function uint8(value) {
      return 0 > value ? 0 : (255 < value ? 255 : Math.round(value));
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    var i;
    for (i = 0; i < imgData.data.length; i += 4) {
      const rotated = rotateRGBHue(imgData.data[i], imgData.data[i+1], imgData.data[i+2], passedIn)

      imgData.data[i] = rotated[0];
      imgData.data[i + 1] = rotated[1];
      imgData.data[i + 2] = rotated[2];
      imgData.data[i + 3] = imgData.data[i + 3];
    }

    ctx.putImageData(imgData, 0, 0);
}

dewit();