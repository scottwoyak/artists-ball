import { glVec3 } from "./glVec";
import { Uniforms } from "./Shaders";
import { PathTracer } from "./PathTracer";
import { glMat4 } from "./glMat";

class App {
   public tracer = new PathTracer();
   private modelview: glMat4;
   private projection: glMat4;
   private modelviewProjection: glMat4;

   constructor() {
   }

   public update(timeSinceStart: number) {
      this.modelview = glMat4.makeLookAt(
         Uniforms.eye,
         new glVec3([0, 0, 0]),  // center point
         new glVec3([0, 1, 0])   // up vector
      );

      this.projection = glMat4.makePerspective(55, 1, 0.1, 100);
      this.modelviewProjection = this.projection.multM(this.modelview);
      this.tracer.update(this.modelviewProjection, timeSinceStart);
   };

   public render(): void {
      this.tracer.render();
   };

   public restart(): void {
      this.tracer.restart();
   }

}

let app: App;
export let gl: WebGLRenderingContext;
let canvas: HTMLCanvasElement;

let angleX = 0;
let angleY = 0;
let zoomZ = 3.0;

function tick(timeSinceStart: number) {
   Uniforms.eye.set(0, zoomZ * Math.sin(angleY) * Math.cos(angleX));
   Uniforms.eye.set(1, zoomZ * Math.sin(angleX));
   Uniforms.eye.set(2, zoomZ * Math.cos(angleY) * Math.cos(angleX));

   app.update(timeSinceStart);
   app.render();
}

window.onload = function () {
   gl = null;
   canvas = document.getElementById('canvas') as HTMLCanvasElement;
   try { gl = canvas.getContext('webgl'); } catch (e) { }

   if (gl) {
      app = new App();
      var start = new Date().getTime();
      setInterval(function () { tick(((new Date()).getTime() - start) * 0.001); }, 1000 / 60);
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
};

function elementPos(element: HTMLElement): any {
   var x = 0, y = 0;
   while (element.offsetParent) {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = element.offsetParent as HTMLElement;
   }
   return { x: x, y: y };
}

function eventPos(event: any) {
   return {
      x: event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft,
      y: event.clientY + document.body.scrollTop + document.documentElement.scrollTop
   };
}

function canvasMousePos(event: MouseEvent) {
   var mousePos = eventPos(event);
   var canvasPos = elementPos(canvas);
   return {
      x: mousePos.x - canvasPos.x,
      y: mousePos.y - canvasPos.y
   };
}

var mouseDown = false;
var oldX: number;
var oldY: number;

document.onmousedown = function (event: MouseEvent) {
   var mouse = canvasMousePos(event);
   oldX = mouse.x;
   oldY = mouse.y;

   if (mouse.x >= 0 && mouse.y >= 0 && mouse.x < 512 && mouse.y < 512) {

      mouseDown = true;

      // disable selection because dragging is used for rotating the camera and moving objects
      return false;
   }

   return true;
};

document.onmousemove = function (event: MouseEvent) {
   var mouse = canvasMousePos(event);

   if (mouseDown) {
      // update the angles based on how far we moved since last time
      angleY -= (mouse.x - oldX) * 0.01;
      angleX += (mouse.y - oldY) * 0.01;

      // don't go upside down
      angleX = Math.max(angleX, -Math.PI / 2 + 0.01);
      angleX = Math.min(angleX, Math.PI / 2 - 0.01);

      // clear the sample buffer
      app.restart();

      // remember this coordinate
      oldX = mouse.x;
      oldY = mouse.y;
   }

   document.onmouseup = function (event) {
      mouseDown = false;
   };
}


