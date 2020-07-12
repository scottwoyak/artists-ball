import { PointerEventHandler } from "./PointerEventHandler";
import { IApp } from "./IApp";
import { Menubar } from "./Menu";
import { Slider } from "./Slider";
import { Vec2 } from "./Vec";
import { Video } from "./Video";
import { Radiobutton } from "./Radiobutton";
import { Downloader } from "./Downloader";
import { Uploader } from "./Uploader";
import { getTimeStr, getSizeStr } from "./Globals";
import { Checkbox } from "./Checkbox";

export function debug(msg: string): void {
   console.log(msg);
   //alert(msg);
}

export class SquintApp implements IApp {
   private handler: PointerEventHandler;
   private div: HTMLDivElement;
   private panelDiv: HTMLDivElement;
   private img: HTMLImageElement;
   private canvas: HTMLCanvasElement;
   private video: HTMLVideoElement;
   private desiredWidth: number;
   private desiredHeight: number;
   private downloader = new Downloader();
   private uploader = new Uploader();

   private brightness: Slider;
   private contrast: Slider;
   private saturate: Slider;
   private blur: Slider;
   private zoom: Slider;
   private quality: Slider;

   private xOffset = 0;
   private yOffset = 0;

   private imgSize = 0;
   private downloadTime: number;

   //private host = 'https://woyaktest.ue.r.appspot.com/';
   //private host = 'http://192.168.86.23:8080/';
   //private host = 'http://localhost:8080/';
   private host = 'http://' + location.hostname + ':8080/';

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

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.downloader.url = this.host;
      this.downloader.onDownload = (blob, downloadTime) => this.onDownload(blob, downloadTime);
      this.downloader.start();

      this.uploader.url = this.host;
      this.uploader.onDataNeeded = () => this.takePicture();

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
         min: 0.1,
         max: 5,
         value: 1,
         oninput: () => this.drawImg(),
         getText: (slider) => (100 * slider.value).toFixed(0) + '%',
      });

      new Checkbox(this.panelDiv, {
         label: 'Pause',
         oncheck: (checkbox) => {
            if (checkbox.checked) {
               this.downloader.stop();
            }
            else {
               this.downloader.start();
            }
         }
      })

      let videoDiv = document.createElement('div');
      videoDiv.id = 'VideoDiv';
      this.panelDiv.appendChild(videoDiv);

      this.quality = new Slider(videoDiv, {
         label: 'Quality',
         min: 0.1,
         max: 1,
         value: 0.92,
         getText: (slider) => slider.value.toFixed(2),
      })

      new Radiobutton(videoDiv, {
         label: 'Off',
         group: 'ResolutionGroup',
         checked: () => { return true },
         oncheck: () => {
            this.enableVideo(false);
         }
      });

      Video.listResolutions((resolution) => {
         new Radiobutton(videoDiv, {
            label: resolution.label,
            group: 'ResolutionGroup',
            //checked: () => { return true },
            oncheck: () => {
               this.desiredWidth = resolution.width;
               this.desiredHeight = resolution.height;
               this.enableVideo(true);
            }
         });
      })
   }

   private onDownload(blob: Blob, downloadTime: number) {

      if (blob.type === 'text/plain') {
         blob.text()
            .then((txt) => {
               console.log(txt);
            })
            .catch((reason) => {
               console.log('cannot retrieve text from blob: ' + reason);
            })
      }
      else {
         let img = document.createElement('img');
         img.onload = () => {
            this.img = img;
            this.downloadTime = downloadTime;
            this.imgSize = blob.size;
            this.drawImg();
         }
         img.onerror = (reason) => {
            console.log('cannot load image: ' + reason);
         }
         img.src = URL.createObjectURL(blob);
      }
   }

   private enableVideo(enable: boolean) {

      if (enable) {

         const constraints = {
            video: {
               width: this.desiredWidth,
               height: this.desiredHeight,
            }
         };

         if (this.video) {
            let stream = this.video.srcObject as MediaStream;
            stream.getVideoTracks()[0].applyConstraints(constraints.video);
         }
         else {
            this.video = document.createElement('video');
            this.video.autoplay = true;
            this.video.style.display = 'none';
            this.div.appendChild(this.video);

            this.video.onplay = () => {
               this.uploader.start();
            };

            try {

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
      }
      else {
         this.uploader.stop();

         if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
            this.video.parentElement.removeChild(this.video);
            this.video.load();
            this.video = null;
         }
      }
   }

   private takePicture(): Promise<Blob> {
      let canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

      // upload
      return new Promise<Blob>((resolve, reject) => {
         canvas.toBlob((blob) => resolve(blob),
            'image/jpeg',
            this.quality.value);
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

      let imgWidth = this.img.width;
      let imgHeight = this.img.height;
      let imgAR = imgWidth / imgHeight;

      let width: number;
      let height: number;
      /*
      if (canvasAR > imgAR) {
         height = this.zoom.value * canvasHeight;
         width = height * imgAR;
      }
      else {
         width = this.zoom.value * canvasWidth;
         height = width / imgAR;
      }
      */
      if (canvasAR > imgAR) {
         height = this.zoom.value * imgHeight;
         width = height * imgAR;
      }
      else {
         width = this.zoom.value * imgWidth;
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

      let msg: string;

      ctx.fillText(this.host, 0, 10);

      msg = imgWidth + 'x' + imgHeight;
      ctx.fillText(msg, 0, canvasHeight - 35);

      msg = 'upload: ' + getTimeStr(this.uploader.uploadTime) + ' - ' + this.uploader.fps.rate.toFixed(1);
      ctx.fillText(msg, 0, canvasHeight - 25);

      msg = 'download: ' + getTimeStr(this.downloadTime) + ' - ' + this.downloader.fps.rate.toFixed(1);
      ctx.fillText(msg, 0, canvasHeight - 15);

      msg = getSizeStr(this.imgSize);
      ctx.fillText(msg, 0, canvasHeight - 5);
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
