import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { IVideoResolution, Video } from './Video';
import { Downloader } from './Downloader';
import { Uploader } from './Uploader';
import { Slider } from '../../GUI/Slider';
import { ICtrl } from '../../GUI/ICtrl';
import { Squint, ISessions } from './Squint';
import { ListBox } from '../../GUI/ListBox';
import { iOS, getTimeStr, getSizeStr } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { Menubar } from '../../GUI/Menu';

let V = 29;

// TODO: 
// - check into camera being in us

let log: HTMLTextAreaElement;

let fullmsg = '';
export function debug(msg: string): void {
   console.log(msg);
   //alert('debug: ' + msg);
   fullmsg = msg + '\n\n' + fullmsg;
   //navigator.clipboard.writeText(fullmsg).catch((err) => alert('error writing to clipboard: ' + err));
   log.textContent = fullmsg;
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
   private downloader: Downloader;
   private uploader: Uploader;

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
   private squint = new Squint();

   private viewListBox: ListBox<string>;
   private sessionId: string;

   private startDialog: HTMLDivElement;
   private sessionNameInput: HTMLInputElement;

   public constructor() {
      log = document.createElement('textarea');
      log.style.position = 'absolute';
      log.style.top = '60%';
      log.style.left = '0px';
      log.style.bottom = '0px';
      log.style.right = '0px';
      log.style.backgroundColor = 'darkblue';
      log.style.color = 'white';
      log.style.fontSize = '12px';
      log.cols = 150;
      document.body.appendChild(log);

      document.title += (' ' + V);
      alert(document.title);
      let msg = '';
      if (iOS()) {
         msg += '. Running on Apple';
      }
      msg += '\nuserAgent: ' + navigator.userAgent;
      msg += '\nplatform: ' + navigator.platform;
      debug(msg);

      this.downloader = new Downloader(this.squint);
      this.downloader.onStop = () => {
         this.showStartDialog(true);
      }
      this.uploader = new Uploader(this.squint);
   }

   public create(div: HTMLDivElement) {

      div.id = 'SquintApp';

      this.startDialog = this.createStartDialog(div);

      this.div = document.createElement('div');
      this.div.className = 'FlexContainer';
      div.appendChild(this.div);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.video = document.createElement('video');
      this.video.id = 'Video';
      this.video.autoplay = true;
      //(<any>this.video).playsinline = true;
      this.video.onerror = (err) => {
         alert('video.onerror(): ' + err);
      }
      this.div.appendChild(this.video);
      this.video.style.display = 'none';

      this.video.onplay = () => {
         debug('video.onplay: \n' +
            'element: ' + this.video.width + ' x ' + this.video.height + '\n' +
            'client: ' + this.video.clientWidth + ' x ' + this.video.clientHeight + '\n' +
            'video: ' + this.video.videoWidth + ' x ' + this.video.videoHeight);

         //this.startSession();
      }

      this.downloader.onDownload = (blob, downloadTime) => this.onDownload(blob, downloadTime);

      this.uploader.onDataNeeded = () => this.takePicture();

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

      window.addEventListener('resize', () => this.onResize());
      this.updateSizes();

      this.showStartDialog();
   }

   public delete() {
   }

   private startSession() {
      try {
         if (!this.sessionId) {
            debug('creating session');
            this.squint.createSession(this.sessionNameInput.value)
               .then((id) => {
                  debug('session created: ' + id);
                  this.sessionId = id;

                  // TODO can't start these until both the session is available and the video is ready
                  debug('starting uploader');
                  this.uploader.start(this.sessionId);
                  debug('starting downloader');
                  this.downloader.start(this.sessionId);
                  debug('both started');
               })
               .catch((err) => {
                  alert('could not create session: ' + err);
                  this.showStartDialog(true);
                  this.enableVideo(false);
               });
         }
      }
      catch (err) {
         debug('this.startSession() ' + err);
      };
   }

   private showStartDialog(show = true) {
      if (show) {
         this.startDialog.style.display = 'block';
      }
      else {
         this.startDialog.style.display = 'none';
      }
   }

   private createStartDialog(div: HTMLDivElement): HTMLDivElement {
      let backgroundDiv = document.createElement('div');
      backgroundDiv.className = 'DialogBackground';
      div.appendChild(backgroundDiv);

      let dialogDiv = document.createElement('div');
      dialogDiv.id = 'DialogDiv';
      backgroundDiv.appendChild(dialogDiv);

      let viewDiv = document.createElement('div');
      viewDiv.id = 'ViewPanelDiv';
      dialogDiv.appendChild(viewDiv);

      let viewHeader = document.createElement('div');
      viewHeader.id = 'ViewHeader';
      viewHeader.className = 'Header';
      viewHeader.innerText = 'View a camera...';
      viewDiv.appendChild(viewHeader);

      this.viewListBox = new ListBox<string>(
         viewDiv, {
         id: 'ViewListBox'
      });
      this.viewListBox.onSelectedChanged = () => {
         goViewButton.disabled = (this.viewListBox.selected === null);
      }

      this.squint.listSessions()
         .then((value) => {
            this.updateList(value);
         });

      let buttonDiv = document.createElement('div');
      buttonDiv.className = 'ButtonDiv';
      viewDiv.appendChild(buttonDiv);

      let goViewButton = document.createElement('button');
      goViewButton.id = 'ViewButton';
      goViewButton.innerText = 'Go';
      goViewButton.disabled = true;
      buttonDiv.appendChild(goViewButton);

      goViewButton.onclick = () => {
         this.showStartDialog(false);
         this.downloader.start(this.viewListBox.selected);
      }

      let orParentDiv = document.createElement('div');
      orParentDiv.id = 'OrParentDiv';
      dialogDiv.appendChild(orParentDiv);

      let orDiv = document.createElement('div');
      orDiv.id = 'OrDiv';
      orDiv.innerText = 'OR';
      orParentDiv.appendChild(orDiv);



      let hostPanelDiv = document.createElement('div');
      hostPanelDiv.id = 'HostPanelDiv';
      dialogDiv.appendChild(hostPanelDiv);

      let hostHeader = document.createElement('div');
      hostHeader.id = 'HostHeader';
      hostHeader.className = 'Header';
      hostHeader.innerText = 'Host a camera...';
      hostPanelDiv.appendChild(hostHeader);

      let cameraNameDiv = document.createElement('div');
      cameraNameDiv.id = 'CameraNameDiv';
      cameraNameDiv.classList.add('Stretch');
      hostPanelDiv.appendChild(cameraNameDiv);

      let nameLabel = document.createElement('label');
      nameLabel.innerText = 'Camera Name:';
      nameLabel.htmlFor = 'NameInputText';
      cameraNameDiv.appendChild(nameLabel);

      this.sessionNameInput = document.createElement('input');
      this.sessionNameInput.type = 'text';
      this.sessionNameInput.id = 'NameInputText';
      this.sessionNameInput.placeholder = 'Your Name';
      cameraNameDiv.appendChild(this.sessionNameInput);
      this.sessionNameInput.oninput = () => {
         goHostButton.disabled = (this.sessionNameInput.value.trim().length === 0);
      };

      buttonDiv = document.createElement('div');
      buttonDiv.classList.add('ButtonDiv', 'NoStretch');
      hostPanelDiv.appendChild(buttonDiv);

      let goHostButton = document.createElement('button');
      goHostButton.id = 'HostOkButton';
      goHostButton.innerText = 'Go';
      goHostButton.disabled = true;
      buttonDiv.appendChild(goHostButton);

      goHostButton.onclick = () => {
         this.showStartDialog(false);
         this.enableVideo(true);
      }

      return backgroundDiv
   }

   private updateList(value: ISessions) {
      try {
         this.viewListBox.clear();
         for (let i = 0; i < value.sessions.length; i++) {
            this.viewListBox.addItem(value.sessions[i].name, value.sessions[i].id);
         }
         this.squint.listSessions(value.responseId)
            .then((value) => {
               this.updateList(value);
            });
      }
      catch (err) {
         debug('updateList() ' + err);
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
         value: 25,
         getText: (slider) => slider.value.toFixed() + '%',
      });
      this.cameraCtrls.push(this.resolution);

      this.enableCameraCtrls(false);

      let sessionMenu = menubar.addSubMenu('Session');

      sessionMenu.addItem('Stop', () => {
         this.downloader.stop();
         this.uploader.stop();
         this.enableVideo(false);
         this.showStartDialog();

         let ctx = this.canvas.getContext('2d');
         ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
      try {
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
      catch (err) {
         debug('onDownload() ' + err);
      }
   }

   private setConstraints() {

      try {

         let constraints: any;
         if (this.desired.deviceId && this.desired.deviceId.trim().length > 0) {
            constraints = {
               video: {
                  width: { ideal: 10 * 1000 },
                  height: { ideal: 10 * 1000 },
                  deviceId: this.desired.deviceId,
               }
            };
         }
         else {
            //debug('no device id, falling back to any camera');
            constraints = {
               video: {
                  width: { ideal: 10 * 1000 },
                  height: { ideal: 10 * 1000 },
               },
            };
         }

         debug('---getUserMedia() ' + JSON.stringify(constraints, null, ' '));
         debug('---navigator.mediaDevices ' + navigator.mediaDevices);
         debug('---navigator.getUserMedia ' + navigator.getUserMedia);
         debug('---navigator.mediaDevices.getUserMedia ' + navigator.mediaDevices.getUserMedia);
         navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
               debug('---getUserMedia().then() ' + stream);
               //alert('---getUserMedia().then() ' + stream + ' ' + stream.getVideoTracks()[0].getSettings().width);

               if (stream === null) {
                  alert('Could not create video stream');
               }
               else {
                  let track = stream.getVideoTracks()[0];
                  let settings = track.getSettings();
                  debug('size: ' + settings.width + ' x ' + settings.height);
                  this.updateVideoSize(settings.width, settings.height);
                  debug('setting video.srcObject to ' + stream);
                  this.video.srcObject = stream;
                  this.video.play()
                     .then(() => {
                        debug('playing');
                     })
                     .catch((err) => {
                        debug('error playing: ' + err);
                     });
                  this.startSession();
               }
            })
            .catch((reason) => {
               alert('video error: ' + reason);
            });
      }
      catch (err) {
         alert('video error2: ' + err);
      }
   }

   private enableVideo(enable: boolean) {

      try {
         // stop the last video
         //this.uploader.stop();
         this.stopTracks();
         //this.video.pause();
         //this.video.srcObject = null;
         //this.video.load();

         this.enableCameraCtrls(enable);

         if (enable) {
            this.video.style.display = 'block';
            this.setConstraints();
         }
         else {
            this.uploader.stop();
            this.downloader.stop();
            this.sessionId = null;
            this.video.style.display = 'none';
         }
      }
      catch (err) {
         debug('enableVideo(' + enable + ') ' + err);
      }

   }

   private stopTracks() {
      try {
         if (this.video.srcObject) {
            debug('stopping tracks');
            // Using the camera is not robust. Applying constraints to change things
            // like which camera is in use only works sometimes. The most robust I can
            // make it is to close the video element and create a new one.
            let stream = this.video.srcObject as MediaStream;
            stream.getTracks().forEach((track: MediaStreamTrack) => {
               track.stop();
            });
         }
      }
      catch (err) {
         debug('stopTracks() ' + err);
      }
   }

   private takePicture(): Promise<Blob> {
      try {
         let canvas = document.createElement('canvas');
         canvas.width = this.video.videoWidth * (this.resolution.value / 100);
         canvas.height = this.video.videoHeight * (this.resolution.value / 100);

         debug('capturing image: ' + canvas.width + 'x' + canvas.height);
         const context = canvas.getContext('2d');
         context.drawImage(this.video, 0, 0, canvas.width, canvas.height);

         // upload
         return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob((blob) => resolve(blob),
               'image/jpeg',
               this.quality.value);
         });
      }
      catch (err) {
         debug('takePicture() ' + err);
      }
   }

   private onResize() {
      this.updateSizes();
   }

   private updateVideoSize(videoWidth: number, videoHeight: number) {
      debug('updateVideoSize(' + videoWidth + ',' + videoHeight + ')');
      try {
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
            debug('updateVideoSize() to ' + this.video.style.width + ' x ' + this.video.style.height);
         }
      }
      catch (err) {
         debug('updateVideoSize() ' + err);
      }
   }

   private updateSizes() {
      try {
         debug('updateSizes()');
         let menubarHeight = document.getElementById('Menubar').clientHeight;
         debug('updateSizes() menubarHeight: ' + menubarHeight);

         let viewWidth = document.documentElement.clientWidth;
         let viewHeight = document.documentElement.clientHeight;

         this.canvas.width = viewWidth;
         this.canvas.height = viewHeight - menubarHeight;

         this.drawImg();
      }
      catch (err) {
         debug('updateSizes() ' + err);
      }
   }



   private drawImg() {
      try {
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

         ctx.fillText(Squint.url, 0, 10);

         msg = imgWidth + 'x' + imgHeight;
         ctx.fillText(msg, 0, canvasHeight - 35);

         msg = 'upload: ' + getTimeStr(this.uploader.uploadTime) + ' - ' + this.uploader.fps.rate.toFixed(1);
         ctx.fillText(msg, 0, canvasHeight - 25);

         msg = 'download: ' + getTimeStr(this.downloadTime) + ' - ' + this.downloader.fps.rate.toFixed(1);
         ctx.fillText(msg, 0, canvasHeight - 15);

         msg = getSizeStr(this.imgSize);
         ctx.fillText(msg, 0, canvasHeight - 5);
      }
      catch (err) {
         debug('drawImg() ' + err);
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
