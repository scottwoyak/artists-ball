import { Uniforms } from "./Shaders";
import { App } from "./app";
import './styles.css';
import { LightColors } from "./LightColors";
import { htmlColor } from "./htmlColor";

let app: App;
export let gl: WebGL2RenderingContext = null;
let canvas: HTMLCanvasElement;

let angleX = 0;
let angleY = 0;
let zoomZ = 3.0;

function component() {
   const element = document.createElement('div');

   element.innerHTML =
      '<canvas id="canvas"></canvas>\n' +
      '<br />\n' +
      '<label for="range1">Intensity</label>\n' +
      '<input id="range1" type="range" min="20" max="100" value="50" class="slider">\n' +
      '<br />\n' +
      '<label for="range2">Temperature</label>\n' +
      '<input id="range2" type="range" min="2000" max="8000" value="' + LightColors.daylight.temperature + '" class="slider">\n' +
      '<span id="colorTemperature">' + LightColors.daylight.temperature + '</span>\n' +
      '<br>\n';

   return element;
}

document.body.appendChild(component());

function tick(timeSinceStart: number) {
   Uniforms.eye.set(0, zoomZ * Math.sin(angleY) * Math.cos(angleX));
   Uniforms.eye.set(1, zoomZ * Math.sin(angleX));
   Uniforms.eye.set(2, zoomZ * Math.cos(angleY) * Math.cos(angleX));

   app.updateTexture(timeSinceStart);
   app.displayTexture();
}

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
      var start = new Date().getTime();
      setInterval(function () { tick(((new Date()).getTime() - start) * 0.001); }, 1000 / 60);

      canvas.ontouchstart = function (event: TouchEvent) {
         event.preventDefault();
         if (event.touches.length === 1) {
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

let slider1 = document.getElementById("range1") as HTMLInputElement;
slider1.value = "" + Uniforms.lightIntensity * 50;
slider1.oninput = function () {
   Uniforms.lightIntensity = parseFloat(slider1.value) / 50;
   app.restart();
}


let slider2 = document.getElementById("range2") as HTMLInputElement;
setLightColor();
slider2.oninput = setLightColor

function setLightColor() {
   let temperature = parseFloat(slider2.value);
   Uniforms.lightColor = LightColors.toRGB(temperature);
   let span = document.getElementById("colorTemperature") as HTMLSpanElement;
   span.innerText = " " + temperature.toFixed() + "K ";

   if (app) {
      app.restart();
   }
}
