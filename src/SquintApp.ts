import { PointerEventHandler } from "./PointerEventHandler";
import { IApp } from "./IApp";
import { Menubar } from "./Menu";
import { Slider } from "./Slider";
import { Vec2 } from "./Vec";
import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import { FPS } from "./FPS";
import { Stopwatch } from "./Stopwatch";

export class SquintApp implements IApp {
   private handler: PointerEventHandler;
   private div: HTMLDivElement;
   private panelDiv: HTMLDivElement;
   private img: HTMLImageElement;
   private canvas: HTMLCanvasElement;
   private video: HTMLVideoElement;

   private brightness: Slider;
   private contrast: Slider;
   private saturate: Slider;
   private blur: Slider;
   private zoom: Slider;

   private xOffset = 0;
   private yOffset = 0;

   private uploadCheckbox: Checkbox;

   private fps = new FPS();
   private fps2 = new FPS();
   private downloadSW = new Stopwatch();
   private uploadSW = new Stopwatch();

   private host = 'https://woyaktest.ue.r.appspot.com/';
   //private host = 'http://' + location.hostname + ':8080/';

   public constructor() {
   }

   public create(div: HTMLDivElement) {

      div.id = 'SquintApp';

      this.div = document.createElement('div');
      this.div.className = 'FlexContainer';
      div.appendChild(this.div);

      this.panelDiv = document.createElement('div');
      this.panelDiv.id = 'Panel';
      this.panelDiv.className = 'Panel';
      this.div.appendChild(this.panelDiv);
      this.buildPanel();

      this.video = document.createElement('video');
      this.video.autoplay = true;
      this.video.style.display = 'none';
      this.div.appendChild(this.video);

      this.video.onplay = (event) => {
         alert('video size: ' + this.video.videoWidth + 'x' + this.video.videoHeight);
         this.onTakePicture();
      };


      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.download();

      /*
      'https://static.wixstatic.com/media/6f1353_883709beb9fc4db2b8e0b882dc7b7792~mv2.jpg'
         */

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

      window.addEventListener('resize', () => this.onResize());
      this.updateSizes();

   }

   public delete() {
   }

   public buildMenu(menubar: Menubar) {
   }

   private buildPanel() {

      new Button(this.panelDiv, {
         label: 'Reset',
         onclick: () => {
            this.brightness.value = 100;
            this.contrast.value = 100;
            this.saturate.value = 100;
            this.blur.value = 0;
            this.drawImg();
         }
      });

      this.brightness = new Slider(this.panelDiv, {
         label: 'Brightness',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0) + '%',
      })

      this.contrast = new Slider(this.panelDiv, {
         label: 'Contrast',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0) + '%',
      });

      this.saturate = new Slider(this.panelDiv, {
         label: 'Chroma',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0) + '%',
      });

      this.blur = new Slider(this.panelDiv, {
         label: 'Blur',
         min: 0,
         max: 10,
         value: 0,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0),
      });

      this.zoom = new Slider(this.panelDiv, {
         label: 'Zoom',
         min: 0.5,
         max: 50,
         value: 1,
         oninput: () => this.drawImg(),
         getText: (slider) => (100 * slider.value).toFixed(0) + '%',
      });

      this.uploadCheckbox = new Checkbox(this.panelDiv, {
         label: 'Use my video A',
         oncheck: (checkbox: Checkbox) => {
            this.enableVideo();
            this.download();
         }
      })
   }

   private download() {

      let delay = 3000;
      if (this.downloadSW.elapsedMs < delay) {
         setTimeout(() => {
            this.download();
         }, delay - this.downloadSW.elapsedMs + 100);
         return;
      }

      this.downloadSW.restart();
      /*
      fetch(this.host,
         {
            method: 'get',
            //mode: 'cors', // needed for development on localhost
         })
         */
      fetch(this.host)
         .then(response => {
            console.log(response);
            return response.blob();
         })
         .then((blob) => {
            if (blob.type === 'text/plain') {
               blob.text()
                  .then((txt) => {
                     console.log(txt);
                  })
                  .finally(() => {
                     // start the next download
                     requestAnimationFrame(() => this.download());
                  });
            }
            else {
               let img = document.createElement('img');
               img.onload = () => {
                  this.img = img;
                  this.drawImg();

                  // TODO what if the img load fails - how do we request the next frame?
                  // start the next download
                  requestAnimationFrame(() => this.download());
               }
               img.src = URL.createObjectURL(blob);
            }
         })
         .catch((reason) => {
            alert(reason);
            console.log('download: ' + reason);
         });

   }

   private enableVideo() {
      if (this.uploadCheckbox.checked) {
         const constraints = {
            video: {
               width: 8 * 1024,
               height: 8 * 1024,
            }
         };

         try {

            // Attach the video stream to the video element and autoplay.
            navigator.mediaDevices.getUserMedia(constraints)
               .then((stream) => {
                  this.video.srcObject = stream;
               })
               .catch((reason) => {
                  alert('video error: ' + reason);
               });
         }
         catch (err) {
            alert('video error2: ' + err);
         }
      }
      else {
         this.video.srcObject = null;
      }
   }

   private onTakePicture() {

      if (this.uploadCheckbox.checked === false) {
         return;
      }

      let delay = 3000
      if (this.uploadSW.elapsedMs < delay) {
         setTimeout(() => {
            this.onTakePicture();
         }, delay - this.uploadSW.elapsedMs + 100);
         return;
      }
      this.uploadSW.restart();

      let canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

      // upload
      canvas.toBlob((blob) => {
         alert('upload size: ' + blob.size / (1024 * 1024));
         let url = URL.createObjectURL(blob);
         let fd = new FormData();
         fd.append('file', blob, 'myBlob');

         let sw = new Stopwatch();
         console.log('XXX starting post');
         fetch(this.host,
            {
               method: 'post',
               //mode: 'cors', // needed for development on localhost
               body: fd
            })
            .then((response) => {
               console.log('XXX posted: ' + sw.elapsedMs.toFixed(1));
               URL.revokeObjectURL(url);
               this.fps2.tick();
               console.log('upload to ' + this.host + ': ' + this.fps2.rate);
               if (this.uploadCheckbox.checked) {
                  this.onTakePicture();
               }
               return response;
            })
            .catch(function (err) {
               alert('post error: ' + err);
               console.log(err);
            });
      });
   }

   private onResize() {
      this.updateSizes();
   }

   private updateSizes() {
      let menubarHeight = document.getElementById('Menubar').clientHeight;
      let panelWidth = this.panelDiv.clientWidth;

      let viewWidth = document.documentElement.clientWidth;
      let viewHeight = document.documentElement.clientHeight;

      this.canvas.width = viewWidth - panelWidth;
      this.canvas.height = viewHeight - menubarHeight;

      this.drawImg();
   }



   private drawImg() {

      if (!this.img) {
         return;
      }

      let canvasWidth = this.canvas.width;
      let canvasHeight = this.canvas.height;
      let canvasAR = canvasWidth / canvasHeight;

      let imgAR = this.img.width / this.img.height;

      let width: number;
      let height: number;
      if (canvasAR > imgAR) {
         height = this.zoom.value * canvasHeight;
         width = height * imgAR;
      }
      else {
         width = this.zoom.value * canvasWidth;
         height = width / imgAR;
      }

      let x = (canvasWidth - width) / 2.0 + this.xOffset;
      let y = (canvasHeight - height) / 2.0 - this.yOffset;

      let ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.filter =
         'brightness(' + this.brightness.value + '%) ' +
         'contrast(' + this.contrast.value + '%) ' +
         'saturate(' + this.saturate.value + '%) ' +
         'blur(' + this.blur.value + 'px) ';

      ctx.drawImage(this.img, x, y, width, height);

      this.fps.tick();
      //console.log('animation ' + this.fps.rate);
   }

   private onScale(scale: number, change: number) {

      // TODO: center scaling about your two fingers

      let factor = change;
      if (this.zoom.value > 2) {
         1 + (change - 1) / (this.zoom.value / 2);
      }
      this.zoom.value *= factor;
      this.xOffset *= factor;
      this.yOffset *= factor;

      this.drawImg();
   }

   private onTranslate(delta: Vec2) {

      //let factor = 1;
      //if (isMobile) {
      //   factor = 2;
      //}

      this.xOffset += delta.x;
      this.yOffset += delta.y;

      this.drawImg();
   }

   private onDrag(pos: Vec2, delta: Vec2) {
      // TODO delta is opposite of translate in Y direction
      this.xOffset += delta.x;
      this.yOffset -= delta.y;

      this.drawImg();
   }
}
