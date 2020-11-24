import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { IVideoConstraint, Camera } from './Camera';
import { Slider } from '../../GUI/Slider';
import { Menubar } from '../../GUI/Menu';
import { Version } from './Version';
import { GUI } from '../../GUI/GUI';
import NoSleep from 'nosleep.js';
import { StorageWithEvents } from './StorageWithEvents';
import { clamp, pxToNumber } from '../../Util/Globals';

export class SeeApp implements IApp {
   private div: HTMLDivElement;
   private storage = new StorageWithEvents();

   private camera: Camera | undefined;
   private canvas: HTMLCanvasElement;
   private saturate: Slider;
   private numLevels: Slider;

   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
   private noSleep = new NoSleep();


   public constructor() {

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.noSleep.enable();

      document.title += (' ' + Version.Build);
   }

   public create(div: HTMLDivElement): void {

      div.id = 'ArtSeeApp';

      this.div = GUI.create('div', 'BodyDiv', div);

      this.canvas = GUI.create('canvas', 'Canvas', this.div);

      this.saturate = new Slider(this.div, {
         label: 'Chroma',
         min: 0,
         max: 200,
         value: 100,
         onGetText: (slider) => slider.value.toFixed(0) + '%',
      });

      this.numLevels = new Slider(this.div, {
         label: 'Levels',
         min: 2,
         max: 25,
         value: 25,
         onGetText: (slider) => {
            if (slider.value === slider.max) {
               return '∞';
            }
            else {
               return slider.value.toFixed(0)
            }
         }
      });


      this.camera = new Camera(this.div);
      this.camera.visible = false;

      Camera.getCameras((constraint: IVideoConstraint, cameraIndex: number, numCameras: number) => {
         if (cameraIndex === (numCameras - 1)) {
            this.camera.start(constraint)
               .catch((err) => {
                  alert('Cannot start camera: ' + err);
               });
         }
      });

      window.addEventListener('resize', () => this.updateSizes());
      this.updateSizes();

      document.onkeydown = (event: KeyboardEvent) => {
         if (event.target instanceof HTMLInputElement === false) {
            switch (event.key) {


               case 'x':
                  break;
            }
         }
      }

      // kick off the rendering loop
      this.drawImg();
   }

   public buildMenu(menubar: Menubar): void {

      const cameraMenu = menubar.addSubMenu('Camera');

      Camera.getCameras((constraint: IVideoConstraint, cameraIndex: number, numCameras: number) => {
         const radioButton = cameraMenu.addRadiobutton(
            {
               label: constraint.label,
               oncheck: () => {
                  this.camera.start(constraint)
                     .catch((err) => {
                        alert('Cannot start camera: ' + err);
                     });
               },
               checked: cameraIndex === (numCameras - 1),
               group: 'CamerasGroup',
            });
      });
   }

   private updateSizes() {
      let menuBar = document.getElementById('Menubar');
      const menubarHeight = menuBar.getBoundingClientRect().height;

      let style = getComputedStyle(this.saturate.div);
      const sliderHeight = this.saturate.div.getBoundingClientRect().height + pxToNumber(style.marginTop) + pxToNumber(style.marginBottom);

      const viewWidth = window.innerWidth;
      const viewHeight = window.innerHeight - 5; // TODO, don't know what this 5 is, but without it the window can scroll up/down by a few pixels

      this.canvas.width = viewWidth;
      this.canvas.height = viewHeight - menubarHeight - 2 * sliderHeight;
   }



   private drawImg() {

      requestAnimationFrame(() => this.drawImg());

      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      const canvasAR = canvasWidth / canvasHeight;

      const cameraWidth = this.camera.videoWidth;
      const cameraHeight = this.camera.videoHeight;
      const cameraAR = cameraWidth / cameraHeight;

      let width: number;
      let height: number;

      if (canvasAR > cameraAR) {
         height = canvasHeight;
         width = height * cameraAR;
      }
      else {
         width = canvasWidth;
         height = width / cameraAR;
      }

      let megaPixels = width * height / (1000 * 1000);
      let scale = 1;
      while (megaPixels > 1) {
         megaPixels /= 4;
         width /= 2;
         height /= 2;
         scale /= 2;
      }

      let imageData = this.camera.takePicture2(megaPixels);

      if (imageData !== null) {

         const ctx = this.canvas.getContext('2d');

         let data = imageData.data;

         let saturate = this.saturate.value;
         let black = 0;
         let white = 1;
         let midPt = 0.5;
         let midValue = 0.5;
         let numLevels = this.numLevels.value < this.numLevels.max ? this.numLevels.value : NaN;

         if (saturate !== 100) {
            let amount = saturate / 100;
            const lumR = (1 - amount) * .3086;
            const lumG = (1 - amount) * .6094;
            const lumB = (1 - amount) * .0820;
            const shiftW = width << 2;
            for (let j = 0; j < height; j++) {
               const offset = j * shiftW;
               for (let i = 0; i < width; i++) {
                  const pos = offset + (i << 2);
                  const r = data[pos + 0];
                  const g = data[pos + 1];
                  const b = data[pos + 2];

                  data[pos + 0] = ((lumR + amount) * r) + (lumG * g) + (lumB * b);
                  data[pos + 1] = (lumR * r) + ((lumG + amount) * g) + (lumB * b);
                  data[pos + 2] = (lumR * r) + (lumG * g) + ((lumB + amount) * b);
               }
            }
         }

         let realMidPt = black + midPt * (white - black);
         for (let i = 0; i < data.length; i += 4) {

            let oldLum = (0.3086 * data[i + 0] + 0.6094 * data[i + 1] + 0.0820 * data[i + 2]) / 255.0;
            let newLum = NaN;

            if (oldLum <= black) {
               newLum = 0;
            }
            else if (oldLum >= white) {
               newLum = 1;
            }
            else {
               if (oldLum < realMidPt) {
                  newLum = 0 + midValue * ((oldLum - black) / (realMidPt - black));
               }
               else {
                  newLum = midValue + (1 - midValue) * (oldLum - realMidPt) / (white - realMidPt);
               }
            }

            if (isNaN(numLevels) === false) {
               let val = newLum;
               newLum = (Math.floor(numLevels * (val - 0.0001)) + 0.5) / numLevels;
            }

            let ratio = newLum / oldLum;
            data[i + 0] = clamp(data[i + 0] * ratio, 0, 255);
            data[i + 1] = clamp(data[i + 1] * ratio, 0, 255);
            data[i + 2] = clamp(data[i + 2] * ratio, 0, 255);
         }

         /*
            if (this.showAsTemperature) {
               // first compute min and max temp
               let minTemp = 255;
               let maxTemp = -255;
               let hsv = new hsvColor([0, 0, 0]);
               for (let i = 0; i < data.length; i += 4) {
                  let r = data[i + 0];
                  let g = data[i + 1];
                  let b = data[i + 2];
                  hsv.fromHtmlValues(r, g, b);
   
                  let temp = this.temperature(r, g, b);
                  minTemp = Math.min(minTemp, temp);
                  maxTemp = Math.max(maxTemp, temp);
               }
               //console.log(minTemp + '   ' + maxTemp);
               let avgTemp = (maxTemp + minTemp) / 2;
   
               for (let i = 0; i < data.length; i += 4) {
                  let r = data[i + 0];
                  let g = data[i + 1];
                  let b = data[i + 2];
                  let temp = this.temperature(r, g, b);
   
                  if (temp < avgTemp) {
                     r = 0;
                     g = 0;
                     b = 255 * (avgTemp - temp) / (avgTemp - minTemp);
                     r = 255 - b;
                     g = 255 - b;
                     b = 255;
                  }
                  else {
                     r = 255 * (temp - avgTemp) / (maxTemp - avgTemp);
                     g = 0;
                     b = 0;
                     g = 255 - r;
                     b = 255 - r;
                     r = 255;
                  }
   
                  data[i + 0] = r;
                  data[i + 1] = g;
                  data[i + 2] = b;
               }
            }
            */

         let tempCanvas = document.createElement('canvas');
         tempCanvas.width = width;
         tempCanvas.height = height;
         let tempCtx = tempCanvas.getContext('2d');
         tempCtx.putImageData(imageData, 0, 0);

         width /= scale;
         height /= scale;
         ctx.drawImage(tempCanvas, (canvasWidth - width) / 2, (canvasHeight - height) / 2, width, height)
      }
   }
}
