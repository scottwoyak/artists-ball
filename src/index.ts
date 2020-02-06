import { Uniforms } from "./Shaders";
import { App } from "./app";
import './styles.css';
import { LightColors } from "./LightColors";
import { hsvColor } from "./hsvColor";
import { Color } from "./Color";
import { ColorRange } from "./ColorRange";
import { glColor } from "./glColor";

let app: App;
export let gl: WebGL2RenderingContext = null;
let canvas: HTMLCanvasElement;

export let angleX = 0;
export let angleY = 0;
export let zoomZ = 3.0;

let skinTones = [
   new Color([255, 218, 200]),
   new Color([232, 179, 117]),
   new Color([190, 136, 87]),
   new Color([115, 91, 59])
   //   new Color([132, 55, 34]),
   //new Color([61, 12, 2]),
   //   new Color([38, 7, 1])
];

function component() {
   const element = document.createElement('div');

   element.innerHTML =
      '<canvas id="canvas"></canvas>\n' +
      '<br />\n' +
      '<label for="intensityRange">Intensity</label>\n' +
      '<input id="intensityRange" type="range" min="0" max="100" value="50" class="slider">\n' +
      '<br />\n' +
      '<label for="temperatureRange">Temperature</label>\n' +
      '<input id="temperatureRange" type="range" min="2000" max="8000" value="' + LightColors.daylight.temperature + '" class="slider">\n' +
      '<span id="temperatureSpan">' + LightColors.daylight.temperature + '</span>\n' +
      '<br>\n' +
      '<label for="ballColorRange">Ball Color</label>\n' +
      '<input id="ballColorRange" type="range" min="0" max="100" value="50" class="slider">\n' +
      '<span id="ballColorSpan"></span>' +
      '<br />\n' +
      '<label for="ambientIntensityRange">Ambient Intensity</label>\n' +
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
intensitySlider.value = "" + Uniforms.uLightIntensity * 100;
intensitySlider.oninput = function () {
   Uniforms.uLightIntensity = parseFloat(intensitySlider.value) / 100;
   app.restart();
}


let temperatureSlider = document.getElementById("temperatureRange") as HTMLInputElement;
setLightColor();
temperatureSlider.oninput = setLightColor

function setLightColor() {
   let temperature = parseFloat(temperatureSlider.value);
   Uniforms.uLightColor = LightColors.toRGB(temperature);
   let span = document.getElementById("temperatureSpan") as HTMLSpanElement;
   span.innerText = temperature.toFixed() + "K";

   if (app) {
      app.restart();
   }
}


/*
let ballColorSlider = document.getElementById("ballColorRange") as HTMLInputElement;
ballColorSlider.value = (parseFloat(ballColorSlider.max) * hsvColor.fromGlColor(Uniforms.uBallColor).h).toString();
setSpanColor();
setBallColor();
ballColorSlider.oninput = setBallColor

function setBallColor() {
   let hue = parseFloat(ballColorSlider.value);
   Uniforms.uBallColor = (new hsvColor([hue / parseFloat(ballColorSlider.max), 0.7, 0.7])).toGlColor();

   setSpanColor();

   if (app) {
      app.restart();
   }
}

function setSpanColor() {
   let span = document.getElementById("ballColorSpan") as HTMLSpanElement;
   span.style.backgroundColor = Uniforms.uBallColor.toHtmlColor().toHex();
}
*/
let skinColorRange = new ColorRange(skinTones);

let ballColorSlider = document.getElementById("ballColorRange") as HTMLInputElement;
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
ambientIntensitySlider.value = "" + Uniforms.uAmbientLightIntensity * 100;
ambientIntensitySlider.oninput = function () {
   Uniforms.uAmbientLightIntensity = parseFloat(ambientIntensitySlider.value) / 100;
   app.restart();
}

