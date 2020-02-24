import { App } from "./app";
import './styles.css';
import { htmlColor } from "./htmlColor";
import { glColorWithTemperature } from "./glColorWithTemperature";
import { Slider } from "./Slider";
import { hsvColor } from "./hsvColor";
import { Uniforms } from "./Uniforms";
import { TabControl } from "./TabControl";
import { SphericalCoord } from "./SphericalCoord";
import { htmlColorWithAlpha } from "./htmlColorWithAlpha";

enum PointerMode {
   View,
   Light,
}

let app: App;
export let gl: WebGLRenderingContext | WebGL2RenderingContext = null;
export let canvas: HTMLCanvasElement;

export let angleX = 0.5;
export let angleY = 0.75;
export let zoomZ = 3.5;

let pointerMode: PointerMode = PointerMode.View;
let pointerModeSpecial = false;
let pos: SphericalCoord;

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

function component(): HTMLElement {
   const div = document.createElement('div');

   const container = document.createElement('span');
   container.className = 'container';
   div.appendChild(container);

   let canvas = document.createElement('canvas');
   canvas.id = 'canvas';
   container.appendChild(canvas);

   let description = document.createElement('div');
   description.id = 'description';
   container.appendChild(description);

   let button = document.createElement('span');
   button.id = 'modeButton';
   button.innerHTML = 'View';
   pointerMode = PointerMode.View;
   button.onclick = () => {
      switch (pointerMode) {
         case PointerMode.View:
            button.innerHTML = 'Light';
            pointerMode = PointerMode.Light;
            break;

         case PointerMode.Light:
            button.innerHTML = 'View';
            pointerMode = PointerMode.View;
            break;
      }
   }
   container.appendChild(button);

   let progressSpan = document.createElement('span');
   progressSpan.id = 'progressSpan';
   container.appendChild(progressSpan);

   div.appendChild(document.createElement('br'));
   div.appendChild(document.createElement('br'));

   let intensitySlider = new Slider(div, {
      id: 'LightIntensity',
      label: 'Light Intensity',
      min: 0,
      max: 100,
      value: Uniforms.uLightIntensity * 100,
      colors: [htmlColor.black, htmlColor.white],
      oninput: function () {
         Uniforms.uLightIntensity = intensitySlider.value / 100;
         app.restart();
      }
   });

   // build a range of colors
   let min = 2000;
   let max = 10000;
   let colors: htmlColor[] = [];
   for (let i = 0; i < 10; i++) {
      let temp = min + (i / 9) * (max - min);
      colors.push(glColorWithTemperature.create(temp).toHtmlColor());
   }
   let lightColorSlider = new Slider(div, {
      id: 'LightColor',
      label: 'Light Color',
      min: 2000,
      max: 10000,
      value: glColorWithTemperature.daylight.temperature,
      colors: colors,
      oninput: setLightColor,
      getText: (slider: Slider) => { return slider.value.toFixed() + "K" }
   });

   // apply the initial colors
   setLightColor();

   function setLightColor() {

      // update the colors for the intensity slider
      intensitySlider.colors = [htmlColor.black, lightColorSlider.htmlColor];

      // use the value in rendering
      Uniforms.uLightColor = lightColorSlider.glColor;
      if (app) {
         app.restart();
      }
   }

   let ballColorSlider = new Slider(div, {
      id: 'BallColor',
      label: 'Ball Color',
      min: 0,
      max: 100,
      value: 50,
      colors: skinTones,
      oninput: () => {
         Uniforms.uBallColor = ballColorSlider.glColor;
         app.restart();
      }
   });

   // make sure gl matches the initial UI setting
   Uniforms.uBallColor = ballColorSlider.glColor;

   let ambientIntensitySlider = new Slider(div, {
      id: 'AmbientIntensity',
      label: 'Ambient Light',
      min: 0,
      max: 100,
      value: Uniforms.uAmbientLightIntensity * 100,
      colors: [htmlColor.black, htmlColor.white],
      oninput: function () {
         Uniforms.uAmbientLightIntensity = ambientIntensitySlider.value / 100;
         app.restart();
      }
   });

   return div;
}

document.body.appendChild(component());

var mouseDown = false;
var oldX: number;
var oldY: number;

window.onload = function () {
   canvas = document.getElementById('canvas') as HTMLCanvasElement;
   gl = canvas.getContext('webgl2') as WebGL2RenderingContext;

   if (!gl) {
      gl = canvas.getContext('webgl') as WebGLRenderingContext;
   }

   if (!gl) {
      // TODO display a message about not being able to create a WebGL context
      console.log("Unable to get WebGL context");
   }
   else {
      app = new App();

      canvas.ontouchstart = function (event: TouchEvent) {
         event.preventDefault();
         if (event.touches.length === 1) {

            let x = event.touches[0].clientX;
            let y = event.touches[0].clientY;

            onDown(event.touches[0].clientX, event.touches[0].clientY);
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
         onDown(event.x, event.y);

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

function onDown(x: number, y: number) {

   if (app.click(x, y)) {
      return;
   };

   pointerModeSpecial = (x < 0.1 * canvas.width) ? true : false;

   oldX = x;
   oldY = y;

   pos = SphericalCoord.fromXYZ(Uniforms.uLightPos.values);

   mouseDown = true;
}

function onMove(x: number, y: number) {
   if (mouseDown) {
      if (pointerMode === PointerMode.View) {
         if (pointerModeSpecial) {
            zoomZ += (y - oldY) * 0.01;
            zoomZ = clamp(zoomZ, 1, 7);
         }
         else {
            // update the angles based on how far we moved since last time
            angleY -= (x - oldX) * 0.01;
            angleX += (y - oldY) * 0.01;

            // don't go upside down
            angleX = Math.max(angleX, -Math.PI / 2 + 0.01);
            angleX = Math.min(angleX, Math.PI / 2 - 0.01);
         }
      }
      else if (pointerMode === PointerMode.Light) {

         if (pointerModeSpecial) {
            pos.radius -= (y - oldY) * 0.005;
            pos.radius = clamp(pos.radius, Uniforms.uBallRadius + 0.5, 5);
            Uniforms.uLightPos.values = pos.toXYZ();
         }
         else {
            pos.rotationAngle += (x - oldX);
            pos.elevationAngle += (y - oldY);
            pos.elevationAngle = clamp(pos.elevationAngle, 0, 180);
            Uniforms.uLightPos.values = pos.toXYZ();
         }
      }

      // clear the sample buffer
      app.restart();

      // remember this coordinate
      oldX = x;
      oldY = y;
   }
}

function clamp(value: number, min: number, max: number): number {
   if (value < min) {
      return min;
   }
   else if (value > max) {
      return max;
   }
   else {
      return value;
   }
}
