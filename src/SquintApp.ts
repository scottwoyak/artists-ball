import { PointerEventHandler } from "./PointerEventHandler";
import { IApp } from "./IApp";
import { Menubar } from "./Menu";
import { Slider } from "./Slider";
import { Vec2 } from "./Vec";
import { Stopwatch } from "./Stopwatch";
import { Video, IVideoResolution } from "./Video";
import { Radiobutton } from "./Radiobutton";

export function debug(msg: string): void {
   console.log(msg);
   alert(msg);
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
   private uploadTime: number;
   private uploading = false;

   private host = 'https://woyaktest.ue.r.appspot.com/';
   //private host = 'http://192.168.86.23:8080/';
   //private host = 'http://localhost:8080/';
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

      let host = document.createElement('div');
      host.innerText = 'A ' + this.host;
      this.panelDiv.appendChild(host);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.download();

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

      window.addEventListener('resize', () => this.onResize());
      this.updateSizes();
      /*
      this.buildPanel()
         .then(() => {

            let div = document.createElement('div');
            div.innerText = this.host;
            this.panelDiv.appendChild(div);

            this.canvas = document.createElement('canvas');
            this.canvas.id = 'Canvas';
            this.div.appendChild(this.canvas);

            this.download();

            this.handler = new PointerEventHandler(this.canvas);
            this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
            this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
            this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

            window.addEventListener('resize', () => this.onResize());
            this.updateSizes();
         })
         .catch((err) => {
            debug('build panel.catch ' + err);
});
         */
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

      let videoDiv = document.createElement('div');
      videoDiv.id = 'VideoDiv';
      this.panelDiv.appendChild(videoDiv);

      this.quality = new Slider(videoDiv, {
         label: 'Quality A',
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
      /*
      return Video.getResolutions()
         .then((resolutions) => {
            let videoDiv = document.createElement('div');
            videoDiv.id = 'VideoDiv';
            this.panelDiv.appendChild(videoDiv);

            let res: IVideoResolution;
            resolutions.forEach((resolution) => {
               res = resolution;
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
            });
            new Radiobutton(videoDiv, {
               label: 'Off',
               group: 'ResolutionGroup',
               checked: () => { return true },
               oncheck: () => {
                  this.enableVideo(false);
               }
            }
            );

            this.quality = new Slider(videoDiv, {
               label: 'Quality A',
               min: 0.1,
               max: 1,
               value: 0.92,
               getText: (slider) => slider.value.toFixed(2),
            })
         })
         .catch((err) => {
            alert('Can query video element: ' + err);
         });
         */
   }

   private download() {

      /*
      let delay = 3000;
      if (this.downloadSW.elapsedMs < delay) {
         setTimeout(() => {
            this.download();
         }, delay - this.downloadSW.elapsedMs + 100);
         return;
      }
      this.downloadSW.restart();
      */

      let sw = new Stopwatch();
      fetch(this.host)
         .then(response => {
            if (response.status !== 200) {
               alert('non 200 error: ' + response.statusText);
            }
            return response.blob();
         })
         .then((blob) => {
            this.downloadTime = sw.elapsedMs;
            this.imgSize = blob.size;
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
            console.log('download failure: ' + reason);
         });

   }

   private enableVideo(enable: boolean) {

      if (enable) {

         this.uploading = true;
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
               console.log('video size: ' + this.video.videoWidth + 'x' + this.video.videoHeight);
               this.onTakePicture();
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
         this.uploading = false;

         if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
            this.video.parentElement.removeChild(this.video);
            this.video.load();
            this.video = null;
         }
      }
   }

   private onTakePicture() {

      if (this.uploading === false) {
         return;
      }

      /*
      let delay = 3000
      if (this.uploadSW.elapsedMs < delay) {
         setTimeout(() => {
            this.onTakePicture();
         }, delay - this.uploadSW.elapsedMs + 100);
         return;
      }
      this.uploadSW.restart();
      */

      let canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth;
      canvas.height = this.video.videoHeight;

      const context = canvas.getContext('2d');
      context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

      // upload
      canvas.toBlob((blob) => {
         if (blob === null) {
            console.log('XXX blob is null');
            return; // TODO when does this happen?
         }

         //console.log('upload size: ' + blob.size / (1024 * 1024));
         let url = URL.createObjectURL(blob);
         let fd = new FormData();
         fd.append('file', blob, 'myBlob');

         // TODO limit to one call at a time
         let sw = new Stopwatch();
         fetch(this.host,
            {
               method: 'post',
               body: fd
            })
            .then((response) => {
               this.uploadTime = sw.elapsedMs;
               URL.revokeObjectURL(url);
               this.onTakePicture();
               return response;
            })
            .catch(function (err) {
               alert('post error: ' + err);
               console.log(err);
            });
      },
         'image/jpeg',
         this.quality.value);
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
         height = this.zoom.value * this.img.height;
         width = height * imgAR;
      }
      else {
         width = this.zoom.value * this.img.width;
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
      let extents: TextMetrics;

      msg = 'upload: ' + this.getTimeStr(this.uploadTime);
      extents = ctx.measureText(msg);
      ctx.fillText(msg, 0, canvasHeight - 25);

      msg = 'download: ' + this.getTimeStr(this.downloadTime);
      extents = ctx.measureText(msg);
      ctx.fillText(msg, 0, canvasHeight - 15);

      msg = this.getSizeStr(this.imgSize);
      extents = ctx.measureText(msg);
      ctx.fillText(msg, 0, canvasHeight - 5);
   }

   private getSizeStr(val: number): string {
      if (val < 1024) {
         return val + ' bytes';
      }
      else if (val < 1024 * 1024) {
         return (val / 1024).toFixed(1) + ' kb';
      }
      else {
         return (val / (1024 * 1024)).toFixed(1) + ' mb';
      }
   }

   private getTimeStr(val: number): string {
      if (val < 1000) {
         return val.toFixed(0) + ' ms';
      }
      else {
         return (val / 1000).toFixed(1) + ' s';
      }
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
