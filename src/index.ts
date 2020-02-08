import { Uniforms } from "./Shaders";
import { App } from "./app";
import './styles.css';
import { LightColors } from "./LightColors";
import { ColorRange } from "./ColorRange";
import { glColor } from "./glColor";
import { htmlColor } from "./htmlColor";

let app: App;
export let gl: WebGL2RenderingContext = null;
let canvas: HTMLCanvasElement;
let gradientStr;

export let angleX = 0;
export let angleY = 0;
export let zoomZ = 3.0;

let skinTones = [
   new htmlColor([240, 223, 214]),
   new htmlColor([255, 218, 200]),
   new htmlColor([232, 179, 117]),
   new htmlColor([190, 136, 87]),
   //   new htmlColor([115, 91, 59]),
   new htmlColor([139, 73, 65])
   //   new htmlColor([132, 55, 34]),
   //new htmlColor([61, 12, 2]),
   //   new htmlColor([38, 7, 1])
];

function component() {
   const element = document.createElement('div');

   element.innerHTML =
      '<canvas id="canvas"></canvas>\n' +
      '<br />\n' +
      '<label>Light Intensity</label>\n' +
      '<input id="intensityRange" type="range" min="0" max="100" value="50" class="slider">\n' +
      '<br />\n' +
      '<label for="temperatureRange">Light Color</label>\n' +
      '<input id="temperatureRange" type="range" min="2000" max="8000" value="' + LightColors.daylight.temperature + '" class="slider">\n' +
      '<span id="temperatureSpan">' + LightColors.daylight.temperature + '</span>\n' +
      '<br>\n' +
      '<label for="ballColorRange">Ball Color</label>\n' +
      '<input id="ballColorRange" type="range" min="0" max="100" value="50" class="slider">\n' +
      '<span id="ballColorSpan"></span>' +
      '<br />\n' +
      '<label for="ambientIntensityRange">Ambient Light</label>\n' +
      '<input id="ambientIntensityRange" type="range" min="0" max="100" value="50" class="slider">\n' +
      '<br />\n' +
      '<br />\n';

   return element;
}

document.body.appendChild(component());

var mouseDown = false;
var oldX: number;
var oldY: number;

window.onload = function () {
   canvas = document.getElementById('canvas') as HTMLCanvasElement;
   try {
      gl = canvas.getContext('webgl2') as WebGL2RenderingContext;
   } catch (e) {
      console.log("Unable to get WebGL2 context");
   }

   if (gl) {
      app = new App();

      canvas.ontouchstart = function (event: TouchEvent) {
         event.preventDefault();
         if (event.touches.length === 1) {
            let size = canvas.width / 4;

            let x = event.touches[0].clientX;
            let y = event.touches[0].clientY;
            if (y < size) {
               if (x > canvas.width - size) {
                  app.swap(1);
                  return;
               }
               else if (x > canvas.width - 2 * size) {
                  app.swap(0);
                  return;
               }
            }

            mouseDown = true;

            oldX = event.touches[0].clientX;
            oldY = event.touches[0].clientY;
         }
      }

      canvas.ontouchmove = function (event: TouchEvent) {
         event.preventDefault();
         onMove(event.touches[0].clientX, event.touches[0].clientY);
      }

      canvas.ontouchend = function (event: TouchEvent) {
         event.preventDefault();
         mouseDown = false;
      }

      canvas.onmousedown = function (event: MouseEvent) {
         oldX = event.x;
         oldY = event.y;

         mouseDown = true;

         // disable selection because dragging is used for rotating the camera and moving objects
         return false;
      }

      canvas.onmousemove = function (event: MouseEvent) {
         onMove(event.x, event.y);
      }

      canvas.onmouseup = function (event) {
         mouseDown = false;
      };

      canvas.onclick = function (event: MouseEvent) {
         let size = canvas.width / 4;

         if (event.y < size) {
            if (event.x > canvas.width - size) {
               app.swap(1);
            }
            else if (event.x > canvas.width - 2 * size) {
               app.swap(0);
            }
         }
      }
   }
}

function onMove(x: number, y: number) {
   if (mouseDown) {
      // update the angles based on how far we moved since last time
      angleY -= (x - oldX) * 0.01;
      angleX += (y - oldY) * 0.01;

      // don't go upside down
      angleX = Math.max(angleX, -Math.PI / 2 + 0.01);
      angleX = Math.min(angleX, Math.PI / 2 - 0.01);

      // clear the sample buffer
      app.restart();

      // remember this coordinate
      oldX = x;
      oldY = y;
   }
}

let intensitySlider = document.getElementById("intensityRange") as HTMLInputElement;
intensitySlider.style.background = 'linear-gradient(90deg, black, white)';
intensitySlider.value = "" + Uniforms.uLightIntensity * 100;
intensitySlider.oninput = function () {
   Uniforms.uLightIntensity = parseFloat(intensitySlider.value) / 100;
   app.restart();
}


let temperatureSlider = document.getElementById("temperatureRange") as HTMLInputElement;

gradientStr = '90deg';
for (let i = 0; i < 10; i++) {
   let min = parseFloat(temperatureSlider.min);
   let max = parseFloat(temperatureSlider.max);
   let temp = min + (i / 9) * (max - min);
   gradientStr += ', ' + LightColors.toRGB(temp).toHtmlColor().toHex();
}
temperatureSlider.style.background = 'linear-gradient(' + gradientStr + ')';

setLightColor();
temperatureSlider.oninput = setLightColor

function setLightColor() {
   let temperature = parseFloat(temperatureSlider.value);
   let lightColor = LightColors.toRGB(temperature);
   Uniforms.uLightColor = lightColor;
   let span = document.getElementById("temperatureSpan") as HTMLSpanElement;
   span.innerText = temperature.toFixed() + "K";

   intensitySlider.style.background = 'linear-gradient(90deg, black, ' + lightColor.toHtmlColor().toHex() + ')';

   if (app) {
      app.restart();
   }
}


let skinColorRange = new ColorRange(skinTones);

let ballColorSlider = document.getElementById("ballColorRange") as HTMLInputElement;
gradientStr = '90deg';
for (let i = 0; i < skinTones.length; i++) {
   gradientStr += ', ' + skinTones[i].toHex();
}
ballColorSlider.style.background = 'linear-gradient(' + gradientStr + ')';
setSpanColor();
setBallColor();
ballColorSlider.oninput = setBallColor

function setBallColor() {
   let color = skinColorRange.get(parseFloat(ballColorSlider.value) / 100.0);
   Uniforms.uBallColor = new glColor([color.r / 255, color.g / 255, color.b / 255]);

   setSpanColor();

   if (app) {
      app.restart();
   }
}

function setSpanColor() {
   let span = document.getElementById("ballColorSpan") as HTMLSpanElement;
   span.style.backgroundColor = Uniforms.uBallColor.toHtmlColor().toHex();
}


let ambientIntensitySlider = document.getElementById("ambientIntensityRange") as HTMLInputElement;
ambientIntensitySlider.style.background = 'linear-gradient(90deg, black, white)';
ambientIntensitySlider.value = "" + Uniforms.uAmbientLightIntensity * 100;
ambientIntensitySlider.oninput = function () {
   Uniforms.uAmbientLightIntensity = parseFloat(ambientIntensitySlider.value) / 100;
   app.restart();
}

