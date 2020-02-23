import { App } from "./app";
import './styles.css';
import { htmlColor } from "./htmlColor";
import { glColorWithTemperature } from "./glColorWithTemperature";
import { Slider } from "./Slider";
import { hsvColor } from "./hsvColor";
import { Uniforms } from "./Uniforms";
import { TabControl } from "./TabControl";
import { SphericalCoord } from "./SphericalCoord";

enum PointerMode {
   View,
   LightDistance,
   LightRotationElevation,
}

let app: App;
export let gl: WebGLRenderingContext | WebGL2RenderingContext = null;
export let canvas: HTMLCanvasElement;

export let angleX = 0.5;
export let angleY = 0.75;
export let zoomZ = 3.5;

let pointerMode: PointerMode = PointerMode.View;
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

   const container = document.createElement('div');
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
   button.style.cursor = 'default';
   pointerMode = PointerMode.View;
   button.onclick = () => {
      switch (pointerMode) {
         case PointerMode.View:
            button.innerHTML = 'Light';
            pointerMode = PointerMode.LightRotationElevation;
            break;

         case PointerMode.LightRotationElevation:
            button.innerHTML = 'View';
            pointerMode = PointerMode.View;
            break;
      }
   }
   container.appendChild(button);

   div.appendChild(document.createElement('br'));

   let tabCtrl = new TabControl(div);

   let setupTabContent = tabCtrl.createTab('Setup');
   let artisticTabContent = tabCtrl.createTab('Artistic Tweaks');

   let intensitySlider = new Slider(setupTabContent, {
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

   setupTabContent.appendChild(document.createElement('br'));

   // build a range of colors
   let min = 2000;
   let max = 10000;
   let colors: htmlColor[] = [];
   for (let i = 0; i < 10; i++) {
      let temp = min + (i / 9) * (max - min);
      colors.push(glColorWithTemperature.create(temp).toHtmlColor());
   }
   let lightColorSlider = new Slider(setupTabContent, {
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

   setupTabContent.appendChild(document.createElement('br'));

   let ballColorSlider = new Slider(setupTabContent, {
      id: 'BallColor',
      label: 'Ball Color',
      min: 0,
      max: 100,
      value: 50,
      colors: skinTones,
      oninput: () => {
         ballLightShiftSlider.colors = computeShiftColors(ballColorSlider.htmlColor, 180);
         ballShadowShiftSlider.colors = computeShiftColors(ballColorSlider.htmlColor, 180);
         ballLightChromaSlider.colors = computeChromaColors(ballLightShiftSlider.htmlColor);
         ballShadowChromaSlider.colors = computeChromaColors(ballShadowShiftSlider.htmlColor);
         Uniforms.uBallColor = ballColorSlider.glColor;
         app.restart();
      }
   });

   // make sure gl matches the initial UI setting
   Uniforms.uBallColor = ballColorSlider.glColor;

   setupTabContent.appendChild(document.createElement('br'));

   let ambientIntensitySlider = new Slider(setupTabContent, {
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

   setupTabContent.appendChild(document.createElement('br'));

   let groupDiv = document.createElement('div');
   groupDiv.className = "SliderGroup";
   let headerDiv = document.createElement('div');
   headerDiv.className = "SliderHeader";
   headerDiv.innerText = "Ball in Light";
   groupDiv.appendChild(headerDiv);
   artisticTabContent.appendChild(groupDiv);

   let ballLightChromaSlider = new Slider(groupDiv, {
      id: 'LightChroma',
      label: 'Chroma',
      min: 0,
      max: 200,
      value: 100,
      colors: computeChromaColors(ballColorSlider.htmlColor),
      oninput: function () {
         Uniforms.uBallLightChroma = ballLightChromaSlider.value / 100;
         app.restart();
      },
      getText: (slider: Slider) => { return slider.value.toFixed() + "%" }
   })

   function computeChromaColors(baseColor: htmlColor): htmlColor[] {
      let hsv = hsvColor.fromHtmlColor(baseColor);
      hsv = new hsvColor([hsv.h, Math.min(hsv.s * 2, 1.0), hsv.v]);
      return [baseColor.toGray(), baseColor, hsv.toHtmlColor()];
   }

   groupDiv.appendChild(document.createElement('br'));

   let ballLightShiftSlider = new Slider(groupDiv, {
      id: 'BallLightShift',
      label: 'Color Shift',
      min: -180,
      max: 180,
      value: 0,
      colors: computeShiftColors(ballColorSlider.htmlColor, 180),
      oninput: function () {
         ballLightChromaSlider.colors = computeChromaColors(ballLightShiftSlider.htmlColor);
         Uniforms.uBallLightShift = ballLightShiftSlider.value;
         app.restart();
      },
      getText: getTemperatureShiftText,
   })

   function computeShiftColors(baseColor: htmlColor, maxShift: number): htmlColor[] {
      let hsv = hsvColor.fromHtmlColor(baseColor);
      let colors: htmlColor[] = [];
      let numSteps = 10;
      for (let i = 0; i < numSteps; i++) {
         let shift = (maxShift - (i / (numSteps - 1)) * (2 * maxShift)) / 360;
         let adjustment = 0;
         if (hsv.h + shift < 0) {
            adjustment = 1;
         }
         else if (hsv.h + shift > 1) {
            adjustment = -1;
         }
         colors.push((new hsvColor([hsv.h + shift + adjustment, hsv.s, hsv.v])).toHtmlColor());
      }
      return colors;
   }

   let separator = document.createElement('div');
   separator.style.height = '2px';
   artisticTabContent.appendChild(separator);

   groupDiv = document.createElement('div');
   groupDiv.className = "SliderGroup";
   headerDiv = document.createElement('div');
   headerDiv.className = "SliderHeader";
   headerDiv.innerText = "Ball in Shadow";
   groupDiv.appendChild(headerDiv);
   artisticTabContent.appendChild(groupDiv);

   let ballShadowChromaSlider = new Slider(groupDiv, {
      id: 'ShadowChroma',
      label: 'Chroma',
      min: 0,
      max: 200,
      value: 100,
      colors: computeChromaColors(ballColorSlider.htmlColor),
      oninput: function () {
         Uniforms.uBallShadowChroma = ballShadowChromaSlider.value / 100;
         app.restart();
      },
      getText: (slider: Slider) => { return slider.value.toFixed() + "%" }
   })

   groupDiv.appendChild(document.createElement('br'));

   let ballShadowShiftSlider = new Slider(groupDiv, {
      id: 'BallShadowShift',
      label: 'Color Shift',
      min: -180,
      max: 180,
      value: 0,
      colors: computeShiftColors(ballColorSlider.htmlColor, 180),
      oninput: function () {
         ballShadowChromaSlider.colors = computeChromaColors(ballShadowShiftSlider.htmlColor);
         Uniforms.uBallShadowShift = ballShadowShiftSlider.value;
         app.restart();
      },
      getText: getTemperatureShiftText,
   })

   function getTemperatureShiftText(slider: Slider): string {
      if (slider.value >= 0) {
         return '+' + slider.value.toFixed() + "º"
      }
      else {
         return slider.value.toFixed() + "º"

      }
   }

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
            if (app.click(x, y)) {
               return;
            }

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

      canvas.onclick = function (event: MouseEvent) {
         app.click(event.x, event.y);
      }
   }
}

function onDown(x: number, y: number) {
   oldX = x;
   oldY = y;

   pos = SphericalCoord.fromXYZ(Uniforms.uLightPos.values);

   mouseDown = true;
}

function onMove(x: number, y: number) {
   if (mouseDown) {
      if (pointerMode === PointerMode.View) {
         // update the angles based on how far we moved since last time
         angleY -= (x - oldX) * 0.01;
         angleX += (y - oldY) * 0.01;

         // don't go upside down
         angleX = Math.max(angleX, -Math.PI / 2 + 0.01);
         angleX = Math.min(angleX, Math.PI / 2 - 0.01);
      }
      else if (pointerMode === PointerMode.LightDistance) {

         pos.radius -= (y - oldY) * 0.002;
         pos.radius = Math.max(0.75, pos.radius);
         Uniforms.uLightPos.values = pos.toXYZ();
      }
      else if (pointerMode === PointerMode.LightRotationElevation) {

         pos.rotationAngle += (x - oldX);
         pos.elevationAngle += (y - oldY);
         pos.elevationAngle = clamp(pos.elevationAngle, 0, 180);
         Uniforms.uLightPos.values = pos.toXYZ();
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
