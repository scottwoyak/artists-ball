import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { IVideoConstraint, Camera } from './Camera';
import { Slider } from '../../GUI/Slider';
import { Menubar } from '../../GUI/Menu';
import { Version } from './Version';
import { GUI } from '../../GUI/GUI';
import NoSleep from 'nosleep.js';
import { pxToNumber } from '../../Util/Globals';
import { ImageFilter } from './ImageFilter';

export class SeeApp implements IApp {
   private div: HTMLDivElement;

   private camera: Camera | undefined;
   private canvas: HTMLCanvasElement;
   private chroma: Slider;
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

      this.chroma = new Slider(this.div, {
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

      let style = getComputedStyle(this.chroma.div);
      const sliderHeight = this.chroma.div.getBoundingClientRect().height + pxToNumber(style.marginTop) + pxToNumber(style.marginBottom);

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

         let numLevels = this.numLevels.value < this.numLevels.max ? this.numLevels.value : NaN;

         if (isNaN(numLevels) === false) {
            let blurSize = 3;
            ImageFilter.blur(imageData, blurSize);
         }

         if (this.chroma.value !== 100) {
            ImageFilter.chroma(imageData, this.chroma.value);
         }

         let white = 1;
         let black = 0;
         let midPt = 0.5;
         let midValue = 0.5;
         if (isNaN(numLevels) === false) {
            ImageFilter.levels(imageData, white, black, midPt, midValue, numLevels);
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
