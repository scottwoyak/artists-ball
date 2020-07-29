import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { IVideoResolution, Video } from './Video';
import { Uploader } from './Uploader';
import { Slider } from '../../GUI/Slider';
import { ICtrl } from '../../GUI/ICtrl';
import { iOS, toTimeStr, toSizeStr } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { Menubar } from '../../GUI/Menu';
import { ConsoleCapture } from '../../Util/ConsoleCapture';
import { StartDialog } from './StartDialog';
import { Version } from './Version';
import { SquintWS, ISession } from './SquintWS';
import { FPS } from '../../Util/FPS';

export function debug(msg: string): void {
   console.error(msg);
   alert('debug error: ' + msg);
}

export class SquintApp implements IApp {
   private handler: PointerEventHandler;
   private div: HTMLDivElement;
   private img: HTMLImageElement;
   private canvas: HTMLCanvasElement;
   private video: HTMLVideoElement;
   private desired: IVideoResolution = {
      label: '',
      width: 0,
      height: 0,
      frameRate: 0,
      facingMode: '',
      deviceId: '',
   };
   private uploader: Uploader;
   private downloadFPS = new FPS();

   private brightness: Slider;
   private contrast: Slider;
   private saturate: Slider;
   private blur: Slider;
   private zoom: Slider;
   private quality: Slider;
   private resolution: Slider;
   private cameraCtrls: ICtrl[] = [];

   private xOffset = 0;
   private yOffset = 0;

   private imgSize = 0;
   private downloadTime: number;
   private squintWS: SquintWS;
   private sessionName = '';

   private startDialog: StartDialog;
   private consoleCapture = new ConsoleCapture();

   public constructor() {

      document.title += (' ' + Version.Build);
      //alert(document.title);
      let msg = '';
      if (iOS()) {
         msg += '. Running on Apple';
      }
      msg += '\nuserAgent: ' + navigator.userAgent;
      msg += '\nplatform: ' + navigator.platform;
      console.log(msg);
   }

   public create(div: HTMLDivElement) {

      div.id = 'SquintApp';
      this.squintWS = new SquintWS();
      this.squintWS.onImage = (blob) => this.onDownload(blob, 0);

      this.squintWS.onClose = () => {
         this.stopUploader();
         this.enableVideo(false);
         this.startDialog.visible = true;

         let ctx = this.canvas.getContext('2d');
         ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      this.squintWS.onError = (msg) => alert('onError: ' + msg);

      this.startDialog = new StartDialog(
         div,
         this.squintWS,
         (sessionId) => {
            this.squintWS.subscribe(sessionId);
         },
         (sessionName) => {
            this.sessionName = sessionName;
            this.enableVideo(true);
         }
      );

      this.div = document.createElement('div');
      this.div.className = 'FlexContainer';
      div.appendChild(this.div);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.video = document.createElement('video');
      this.video.id = 'Video';
      this.video.autoplay = true;
      this.video.onerror = (err) => {
         alert('video.onerror(): ' + err);
      }
      this.div.appendChild(this.video);
      this.video.style.display = 'none';

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

      window.addEventListener('resize', () => this.onResize());
      this.updateSizes();

      this.startDialog.visible = true;
   }

   public delete() {
   }

   private startSession() {
      console.log('creating session \'' + this.sessionName + '\' on ' + SquintWS.url);
      this.squintWS.createSession(this.sessionName)
         .then((session) => {
            console.log('session created: ' + session.id);
            this.startUploader(session.id);
            this.squintWS.subscribe(session.id);
         })
         .catch((err) => {
            alert('Failed to create session: ' + err);
            this.startDialog.visible = true;
            this.enableVideo(false);
         });
   }

   private startUploader(sessionId: string) {
      console.log('starting uploader, video.readyState=' + this.video.readyState);
      this.uploader = new Uploader(
         this.squintWS,
         () => this.takePicture()
      );
   }
   private stopUploader() {
      if (this.uploader) {
         this.uploader.stop();
         this.uploader = null;
      }
   }




   private enableCameraCtrls(flag: boolean) {
      for (let i = 0; i < this.cameraCtrls.length; i++) {
         this.cameraCtrls[i].enabled = flag;
      }
   }

   public buildMenu(menubar: Menubar) {

      let viewMenu = menubar.addSubMenu('View');

      this.brightness = viewMenu.addSlider({
         label: 'Brightness',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0) + '%',
      })

      this.contrast = viewMenu.addSlider({
         label: 'Contrast',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0) + '%',
      });

      this.saturate = viewMenu.addSlider({
         label: 'Chroma',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0) + '%',
      });

      this.blur = viewMenu.addSlider({
         label: 'Blur',
         min: 0,
         max: 10,
         value: 0,
         oninput: () => this.drawImg(),
         getText: (slider) => slider.value.toFixed(0),
      });

      this.zoom = viewMenu.addSlider({
         label: 'Zoom',
         min: 0.1,
         max: 5,
         value: 1,
         oninput: () => this.drawImg(),
         getText: (slider) => (100 * slider.value).toFixed(0) + '%',
      });








      let cameraMenu = menubar.addSubMenu('Camera');

      let firstItem = true;
      Video.getCameras((resolution) => {

         let radioButton = cameraMenu.addRadiobutton(
            {
               label: resolution.label,
               oncheck: () => {
                  this.desired = resolution;
                  this.enableVideo(true);
               },
               checked: firstItem,
               group: 'CamerasGroup',
            });
         if (firstItem) {
            this.desired = resolution;
            firstItem = false;
         }

         this.cameraCtrls.push(radioButton);
      })

      let button = cameraMenu.addItem('Capabilities...', () => {
         if (this.video.srcObject) {
            let stream = this.video.srcObject as MediaStream;
            let track = stream.getVideoTracks()[0];
            if (track.getCapabilities) {
               let capabilities = track.getCapabilities();
               let msg = 'Camera Capabilities:\n';
               for (let key in capabilities) {
                  if (key === 'deviceId' || key === 'groupId') {
                     continue;
                  }
                  msg += this.capabilityToString(capabilities, key) + '\n';
               }
               alert(msg);
               console.log(JSON.stringify(capabilities, null, ' '));
            }
         }
      })

      this.quality = cameraMenu.addSlider({
         label: 'Quality',
         min: 0.1,
         max: 1,
         value: 0.5,
         getText: (slider) => (100 * slider.value).toFixed() + '%',
      });
      this.cameraCtrls.push(this.quality);

      this.resolution = cameraMenu.addSlider({
         label: 'Resolution',
         min: 10,
         max: 100,
         value: 50,
         getText: (slider) => slider.value.toFixed() + '%',
      });
      this.cameraCtrls.push(this.resolution);

      this.enableCameraCtrls(false);

      let sessionMenu = menubar.addSubMenu('Session');

      sessionMenu.addItem('Stop', () => {
         this.squintWS.close();
      });

      let item = sessionMenu.addItem('Show Log', () => {
         this.consoleCapture.show = !this.consoleCapture.show;
         item.innerText = this.consoleCapture.show ? 'Hide Log' : 'Show Log';
      });
   }

   private numToString(num: number): string {
      if (Number.isInteger(num)) {
         return num.toString();
      }
      else {
         return num.toFixed(3);
      }
   }

   private capabilityToString(capabilities: MediaTrackCapabilities, name: string): string {
      let obj = (<any>capabilities)[name];
      let str = name + ': ';
      if (typeof obj === 'object') {
         if (obj['min'] !== undefined) {
            str += this.numToString(obj['min'] as number) + ' to ' + this.numToString(obj['max'] as number);
         }
         else if (obj instanceof Array) {
            for (let i = 0; i < obj.length; i++) {
               if (i > 0) {
                  str += ', ';
               }
               str += JSON.stringify(obj[i]);
            }
         }
         else {
            str += JSON.stringify(obj);
         }
      }
      else {
         str += JSON.stringify(obj);
      }
      return str;
   }

   private onDownload(blob: Blob, downloadTime: number) {
      // TODO text download is an error
      if (blob.type === 'text/plain') {
         blob.text()
            .then((txt) => {
               debug(txt);
            })
            .catch((reason) => {
               debug('cannot retrieve text from blob: ' + reason);
            })
      }
      else {
         this.downloadFPS.tick();
         let img = document.createElement('img');
         img.onload = () => {
            this.img = img;
            this.downloadTime = downloadTime;
            this.imgSize = blob.size;
            this.drawImg();
         }
         img.onerror = (reason) => {
            alert('cannot load image: ' + reason);
         }
         img.src = URL.createObjectURL(blob);
      }
   }

   private setConstraints() {

      let constraints: any;
      if (this.desired.deviceId && this.desired.deviceId.trim().length > 0) {
         constraints = {
            video: {
               width: { ideal: 10 * 1000 },
               height: { ideal: 10 * 1000 },
               deviceId: this.desired.deviceId,
            },
            audio: false,
         };
      }
      else {
         //debug('no device id, falling back to any camera');
         constraints = {
            video: {
               width: { ideal: 10 * 1000 },
               height: { ideal: 10 * 1000 },
            },
            audio: false,
         };
      }

      console.log('---getUserMedia() requesting\n' + JSON.stringify(constraints, null, ' '));
      navigator.mediaDevices.getUserMedia(constraints)
         .then((stream) => {
            console.log('---getUserMedia().then() ' + stream);
            //alert('---getUserMedia().then() ' + stream + ' ' + stream.getVideoTracks()[0].getSettings().width);

            if (stream === null) {
               alert('Could not create video stream');
            }
            else {
               let track = stream.getVideoTracks()[0];
               let settings = track.getSettings();
               console.log('actual video size: ' + settings.width + ' x ' + settings.height);
               this.updateVideoSize(settings.width, settings.height);
               console.log('setting video.srcObject to ' + stream);
               this.video.srcObject = stream;
               this.video.play()
                  .then(() => {
                     console.log('playing');
                     this.updateVideoSize(this.video.videoWidth, this.video.videoHeight);
                  })
                  .catch((err) => {
                     console.log('error playing: ' + err);
                  });
               if (!this.uploader) {
                  this.startSession();
               }
            }
         })
         .catch((reason) => {
            alert('video error: ' + reason);
         });
   }

   private enableVideo(enable: boolean) {

      // stop the last video
      this.stopTracks();

      this.enableCameraCtrls(enable);

      if (enable) {
         this.video.style.display = 'block';
         this.setConstraints();
      }
      else {
         this.stopUploader();
         this.video.style.display = 'none';
      }
   }

   private stopTracks() {
      if (this.video.srcObject) {
         console.log('stopping tracks');
         // Using the camera is not robust. Applying constraints to change things
         // like which camera is in use only works sometimes. The most robust I can
         // make it is to close the video element and create a new one.
         let stream = this.video.srcObject as MediaStream;
         stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
         });
      }
   }

   private takePicture(): Promise<Blob> {

      let canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth * (this.resolution.value / 100);
      canvas.height = this.video.videoHeight * (this.resolution.value / 100);

      //console.log('capturing image: ' + canvas.width + 'x' + canvas.height);
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

   private updateVideoSize(videoWidth: number, videoHeight: number) {
      if (getComputedStyle(this.video).display !== 'none') {
         let videoSize = Math.max(this.video.clientWidth, this.video.clientHeight);
         if (videoWidth > videoHeight) {
            this.video.style.width = videoSize + 'px';
            this.video.style.height = (videoSize * videoHeight / videoWidth) + 'px';
         }
         else {
            this.video.style.height = videoSize + 'px';
            this.video.style.width = (videoSize * videoWidth / videoHeight) + 'px';
         }
      }
   }

   private updateSizes() {
      let menubarHeight = document.getElementById('Menubar').clientHeight;

      this.consoleCapture.setEdges(0, 0, menubarHeight, 0);
      let viewWidth = document.documentElement.clientWidth;
      let viewHeight = document.documentElement.clientHeight;

      this.canvas.width = viewWidth;
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

      ctx.fillText(SquintWS.url, 0, 10);

      msg = imgWidth + 'x' + imgHeight;
      ctx.fillText(msg, 0, canvasHeight - 35);

      if (this.uploader) {
         msg = 'upload: ' + this.uploader.fps.rate.toFixed(1);
         ctx.fillText(msg, 0, canvasHeight - 25);
      }

      msg = 'download: ' + this.downloadFPS.rate.toFixed(1);
      ctx.fillText(msg, 0, canvasHeight - 15);

      msg = toSizeStr(this.imgSize);
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
