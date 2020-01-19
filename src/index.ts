import { Uniforms } from "./Shaders";
import { glVec3 } from "./glVec";
import { App } from "./app";
import './styles.css';

let app: App;
export let gl: WebGL2RenderingContext = null;
let canvas: HTMLCanvasElement;

let angleX = 0;
let angleY = 0;
let zoomZ = 3.0;

function component() {
   const element = document.createElement('div');

   // Lodash, now imported by this script
   element.innerHTML =
      '<canvas id="canvas"></canvas>\n' +
      '<br />\n' +
      '<label for="range1">Light</label>\n' +
      '<input id="range1" type="range" min="1" max="100" value="50" class="slider">\n' +
      '<input id="picker1" type="color">\n' +
      '<br>\n' +
      '<label for="picker2">Ball</label>\n' +
      '<input id="picker2" type="color">\n';

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

let slider = document.getElementById("range1") as HTMLInputElement;
slider.value = "" + Uniforms.lightIntensity * 50;
slider.oninput = function () {
   Uniforms.lightIntensity = parseFloat(slider.value) / 50;
   app.restart();
}

function componentToHex(c: number): string {
   var hex = c.toString(16);
   return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r: number, g: number, b: number): string {
   return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex: string) {
   var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
   return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
   } : null;
}

var lightPicker = document.getElementById("picker1") as HTMLInputElement;
var r = Math.round(255 * Uniforms.lightColor.get(0));
var g = Math.round(255 * Uniforms.lightColor.get(1));
var b = Math.round(255 * Uniforms.lightColor.get(2));
lightPicker.value = rgbToHex(r, g, b)
lightPicker.oninput = function () {
   var color = hexToRgb(lightPicker.value);
   Uniforms.lightColor = new glVec3([color.r / 255.0, color.g / 255.0, color.b / 255.0]);
   app.restart();
}

var ballPicker = document.getElementById("picker2") as HTMLInputElement;
r = Math.round(255 * Uniforms.ballColor.get(0));
g = Math.round(255 * Uniforms.ballColor.get(1));
b = Math.round(255 * Uniforms.ballColor.get(2));
ballPicker.value = rgbToHex(r, g, b);
ballPicker.oninput = function () {
   var color = hexToRgb(ballPicker.value);
   Uniforms.ballColor = new glVec3([color.r / 255.0, color.g / 255.0, color.b / 255.0]);
   app.restart();
}

