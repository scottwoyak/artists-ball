import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { IVideoConstraint, Camera, IMediaSettingsRange, IVideoTrackAdvancedCapabilities, IVideoTrackAdvancedSettings, AdvancedConstraintMode, AdvancedConstraintName } from './Camera';
import { Uploader } from './Uploader';
import { Slider } from '../../GUI/Slider';
import { ICtrl } from '../../GUI/ICtrl';
import { iOS, toSizeStr, isMobile } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { Menubar, SubMenu } from '../../GUI/Menu';
import { ConsoleCapture } from '../../Util/ConsoleCapture';
import { StartDialog } from './StartDialog';
import { Version } from './Version';
import { Squint } from './Squint';
import { FPS } from '../../Util/FPS';
import { ReconnectingDialog } from './ReconnectingDialog';
import { WelcomeDialog } from './WelcomeDialog';
import { Cookie } from '../../Util/Cookie';
import { UserNameDialog } from './UserNameDialog';

export class SquintStrings {
   public static readonly CAMERA_NOT_READY = 'Camera not ready';
};

export function debug(msg: string): void {
   console.error(msg);
   //alert('debug error: ' + msg);
}

interface IConstraintHolder {
   constraint: AdvancedConstraintName,
   value: (() => string) | (() => number),
}

interface IConstraintItem {
   constraint: AdvancedConstraintName,
   label: string,
}

export class SquintApp implements IApp {
   private handler: PointerEventHandler;
   private div: HTMLDivElement;
   private userNameMenuItemDiv: HTMLDivElement;
   private img: HTMLImageElement;

   private camera = new Camera();
   private canvas: HTMLCanvasElement;
   private video: HTMLVideoElement;
   private desired: IVideoConstraint = {
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
   private jpegQuality: Slider;
   private cameraScale: Slider;
   private cameraCtrls: ICtrl[] = [];

   private advancedConstraints: IConstraintHolder[] = [];
   private advancedSubMenu: SubMenu;

   private xOffset = 0;
   private yOffset = 0;

   private imgSize = 0;
   private squint: Squint;

   private startDialog: StartDialog;

   private consoleCapture = new ConsoleCapture();

   private get userName(): string {
      return Cookie.get('UserName');
   }

   private set userName(userName: string) {
      let oldUserName = this.userName;
      Cookie.set('UserName', userName, 365 * 24 * 60 * 60);

      if (userName !== oldUserName) {
         this.userNameMenuItemDiv.innerText = 'Hi ' + userName;

         if (this.squint && this.squint.connected) {
            this.squint.updateConnectionInfo({ userName: userName });
         };
      }
   }

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

      //Cookie.delete('UserName'); // simulates starting up the first time
   }

   public create(div: HTMLDivElement) {

      div.id = 'SquintApp';
      this.squint = new Squint();
      this.squint.onImage = (blob) => this.onDownload(blob);

      this.squint.onClose = () => {
         this.closeConnection();
      }
      this.squint.onError = (msg) => alert('onError: ' + msg);

      this.startDialog = new StartDialog(
         div,
         this.squint,
         (connectionId) => {
            this.squint.subscribe(connectionId);
         },
         () => {
            this.enableVideo(true);
         },
         () => {
            return this.userName;
         },
         (name: string) => {
            this.userName = name;
         }
      );

      let reconnectingDlg = new ReconnectingDialog(div);
      let timeout: number;
      this.squint.onReconnecting = () => {
         console.log('connection lost, reconnecting...');
         timeout = window.setTimeout(() => {
            timeout = null;
            reconnectingDlg.visible = true;
         }, 200);
      }
      this.squint.onReconnected = (success: boolean) => {
         console.log('reconnected: success=' + success);
         if (timeout) {
            clearTimeout(timeout);
         }
         timeout = null;

         reconnectingDlg.visible = false;

         if (this.startDialog.visible) {
            this.startDialog.connect();
         }
      }

      this.div = document.createElement('div');
      this.div.className = 'FlexContainer';
      div.appendChild(this.div);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.video = document.createElement('video');
      this.video.id = 'Video';
      this.video.autoplay = true;
      this.video.setAttribute('playsinline', 'true'); // needed for iPhones
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

      if (!this.userName) {
         this.showWelcomeDialog();
      }
      else {
         // refresh the expiration date
         Cookie.updateExpiration('UserName', 365 * 24 * 60 * 60);
         this.startDialog.visible = true;
      }


      document.onkeypress = async (event: KeyboardEvent) => {
         switch (event.key) {

            case 'x':
               // simulate killing the connection
               (<any>this.squint.ss).ws.close(3000);
               break;

         }
      }
   }

   private showWelcomeDialog() {
      let welcomeDialog = new WelcomeDialog(this.div, (userName) => {
         this.userName = userName;
         this.startDialog.visible = true;
      });
      welcomeDialog.visible = true;
   }

   public closeConnection() {
      if (this.squint.connected) {
         this.squint.close();
      }

      this.stopUploader();
      this.enableVideo(false);
      this.startDialog.visible = true;

      let ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
   }

   public delete() {
   }

   private startSession() {
      console.log('creating session \'' + this.userName + '\' on ' + Squint.url);
      this.squint.createSession();
      this.startUploader();
   }

   private startUploader() {
      console.log('starting uploader, video.readyState=' + this.video.readyState);
      this.uploader = new Uploader(
         this.squint,
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
         onGetText: (slider) => slider.value.toFixed(0) + '%',
      })

      this.contrast = viewMenu.addSlider({
         label: 'Contrast',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         onGetText: (slider) => slider.value.toFixed(0) + '%',
      });

      this.saturate = viewMenu.addSlider({
         label: 'Chroma',
         min: 0,
         max: 200,
         value: 100,
         oninput: () => this.drawImg(),
         onGetText: (slider) => slider.value.toFixed(0) + '%',
      });

      this.blur = viewMenu.addSlider({
         label: 'Blur',
         min: 0,
         max: 10,
         value: 0,
         oninput: () => this.drawImg(),
         onGetText: (slider) => slider.value.toFixed(0),
      });

      this.zoom = viewMenu.addSlider({
         label: 'Zoom',
         min: 1,
         max: 5,
         value: 1,
         oninput: () => this.drawImg(),
         onGetText: (slider) => (100 * slider.value).toFixed(0) + '%',
      });








      let cameraMenu = menubar.addSubMenu('Camera');

      let firstItem = true;
      Camera.getCameras((constraint) => {

         let radioButton = cameraMenu.addRadiobutton(
            {
               label: constraint.label,
               oncheck: () => {
                  this.desired = constraint;
                  this.enableVideo(true);
               },
               checked: firstItem,
               group: 'CamerasGroup',
            });
         if (firstItem) {
            this.desired = constraint;
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

      this.jpegQuality = cameraMenu.addSlider({
         label: 'JPeg Photo Quality',
         min: 0.1,
         max: 1,
         value: 0.5,
         onGetText: (slider) => (100 * slider.value).toFixed() + '%',
      });
      this.cameraCtrls.push(this.jpegQuality);

      this.cameraScale = cameraMenu.addSlider({
         label: 'Camera Resolution',
         min: 0.1,
         max: 1,
         value: 0.5,
         onGetText: (slider) => (100 * slider.value).toFixed() + '%',
      });
      this.cameraCtrls.push(this.cameraScale);

      this.advancedSubMenu = cameraMenu.addSubMenu('Advanced');

      this.enableCameraCtrls(false);

      let sessionMenu = menubar.addSubMenu('Session');

      sessionMenu.addItem('Stop', () => {
         this.closeConnection();
      });

      let item = sessionMenu.addItem('Show Log', () => {
         this.consoleCapture.show = !this.consoleCapture.show;
         item.innerText = this.consoleCapture.show ? 'Hide Log' : 'Show Log';
      });

      this.userNameMenuItemDiv = menubar.addItem('Hi ' + (this.userName ?? ''),
         () => {
            new UserNameDialog(
               this.div,
               this.userName,
               (userName: string) => {
                  this.userName = userName;
               });
         });
      this.userNameMenuItemDiv.id = 'UserNameItemDiv';
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

   private onDownload(blob: Blob) {

      if (!blob) {
         debug('onDownload() blob is null');
      }

      // let the server know we're ready for the next download
      this.squint.requestNextImage();
      this.drawBlob(blob);
   }

   private drawBlob(blob: Blob) {
      this.downloadFPS.tick();
      let img = document.createElement('img');
      img.onload = () => {
         this.img = img;
         this.imgSize = blob.size;
         // TODO how do we know that this connection is the same as the one that
         // initiated the request?
         if (this.squint.connected) {
            this.drawImg();
         }
      }
      img.onerror = (reason) => {
         alert('cannot load image: ' + reason);
      }
      img.src = URL.createObjectURL(blob);
   }

   private setConstraints() {

      let constraints: any;
      if (this.desired.deviceId && this.desired.deviceId.trim().length > 0) {
         constraints = {
            video: {
               width: { ideal: 10 * 1000 },
               height: { ideal: 10 * 1000 },
               facingMode: this.desired.facingMode,
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
               facingMode: this.desired.facingMode,
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
               // let the Video object know that the user has know granted user permission
               // to use the camera
               Camera.videoEnabled = true;

               let track = stream.getVideoTracks()[0];
               let settings = track.getSettings();

               if (Math.max(settings.width, settings.height) > 1000) {
                  this.cameraScale.value = Math.min(1000 / settings.width, 1000 / settings.height);
               }

               console.log('actual video size: ' + settings.width + ' x ' + settings.height);
               this.updateVideoSize(settings.width, settings.height);

               console.log('setting video.srcObject to ' + stream);
               this.video.srcObject = stream;
               this.video.play()
                  .then(() => {
                     console.log('playing');
                     this.buildAdvancedSubMenu(track);
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

   private buildAdvancedSubMenu(track: MediaStreamTrack) {
      console.log('clearing menu');
      this.advancedSubMenu.clear();
      this.advancedConstraints = [];

      let capabilities = track.getCapabilities() as IVideoTrackAdvancedCapabilities;
      let settings = track.getSettings() as IVideoTrackAdvancedSettings;

      console.log('building advanced menu: ' + JSON.stringify(capabilities, null, ' '));

      let whiteBalanceMode: IConstraintItem = {
         constraint: 'whiteBalanceMode',
         label: 'Auto White Blance'
      }
      let colorTemperature: IConstraintItem = {
         constraint: 'colorTemperature',
         label: 'Temperature'
      }
      let exposureMode: IConstraintItem = {
         constraint: 'exposureMode',
         label: 'Auto Exposure'
      }
      let exposureCompensation: IConstraintItem = {
         constraint: 'exposureCompensation',
         label: 'F-Stop'
      }
      let exposureTime: IConstraintItem = {
         constraint: 'exposureTime',
         label: 'Exposure'
      }
      let iso: IConstraintItem = {
         constraint: 'iso',
         label: 'ISO'
      }
      let focusMode: IConstraintItem = {
         constraint: 'focusMode',
         label: 'Auto Focus'
      }
      let focusDistance: IConstraintItem = {
         constraint: 'focusDistance',
         label: 'Focus'
      }
      let zoom: IConstraintItem = {
         constraint: 'zoom',
         label: 'Zoom'
      }

      if (capabilities.whiteBalanceMode && capabilities.colorTemperature) {
         this.addAdvancedItems(
            settings,
            capabilities,
            whiteBalanceMode,
            [colorTemperature]
         );
      }

      if (
         capabilities.exposureMode &&
         (capabilities.exposureCompensation || capabilities.exposureTime || capabilities.iso)
      ) {
         this.addAdvancedItems(
            settings,
            capabilities,
            exposureMode,
            [exposureCompensation, exposureTime, iso]
         );
      }

      if (capabilities.focusMode && capabilities.focusDistance) {
         this.addAdvancedItems(
            settings,
            capabilities,
            focusMode,
            [focusDistance]
         );
      }

      if (capabilities.zoom) {
         this.addAdvancedSlider(settings, capabilities, zoom);
      }
   }

   private addAdvancedItems(
      settings: IVideoTrackAdvancedSettings,
      capabilities: IVideoTrackAdvancedCapabilities,
      checkboxSetup: IConstraintItem,
      sliderSetups: IConstraintItem[]
   ) {

      let sliders: Slider[] = [];
      let checkbox = this.advancedSubMenu.addCheckbox({
         label: checkboxSetup.label,
         oncheck: (checkbox) => {
            for (let slider of sliders) {
               slider.enabled = !checkbox.checked;
            }
            this.applyConstraints();
         },
         checked: (<any>settings)[checkboxSetup.constraint] === 'continuous',
      });

      console.log('adding checkbox: ' + checkboxSetup.constraint);
      this.advancedConstraints.push({
         constraint: checkboxSetup.constraint,
         value: () => { return checkbox.checked ? 'continuous' : 'manual'; }
      });

      for (let item of sliderSetups) {

         if (capabilities[item.constraint]) {
            let slider = this.addAdvancedSlider(settings, capabilities, item);
            slider.enabled = !checkbox.checked;

            sliders.push(slider);
         }
      }
   }

   private addAdvancedSlider(
      settings: IVideoTrackAdvancedSettings,
      capabilities: IVideoTrackAdvancedCapabilities,
      item: IConstraintItem,
   ): Slider {

      let range = capabilities[item.constraint] as IMediaSettingsRange;
      let slider = this.advancedSubMenu.addSlider({
         label: item.label,
         min: range.min,
         max: range.max,
         value: settings[item.constraint] as number,
         onGetText: (slider) => { return slider.value.toFixed(); },
         oninput: () => { this.applyConstraints(); }
      })

      console.log('adding slider: ' + item.constraint);
      this.advancedConstraints.push({
         constraint: item.constraint,
         value: () => { return slider.value; }
      });
      return slider;
   }

   private applyConstraints() {
      let stream = this.video.srcObject as MediaStream;
      let track = stream.getVideoTracks()[0];

      let constraints = { advanced: [] = [] } as any;
      let constraint: any = {};
      for (let item of this.advancedConstraints) {
         constraint[item.constraint] = item.value();
      }

      console.log('setting advanced constraints: ' + JSON.stringify(constraint, null, ' '));
      constraints.advanced.push(constraint);

      track.applyConstraints(<MediaTrackConstraints><any>(constraints))
         .catch((err) => {
            debug('Cannot apply constraints: ' + err);
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
         console.log('clearing menu');
         this.advancedSubMenu.clear();
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

      if (!this.squint.connected) {
         console.error('takePicture() after close');
      }

      return this.camera.takePicture(this.video, this.cameraScale.value, this.jpegQuality.value)
         .then((blob: Blob) => {
            // draw what was uploaded, i.e. simulate a download
            this.drawBlob(blob);
            return blob;
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

      if (this.img) {
         this.drawImg();
      }
   }



   private drawImg() {

      if (!this.squint.connected) {
         console.error('drawImg() after close');
         return;
      }

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

      if (canvasAR > imgAR) {
         height = this.zoom.value * canvasHeight;
         width = height * imgAR;
      }
      else {
         width = this.zoom.value * canvasWidth;
         height = width / imgAR;
      }

      /*
      if (canvasAR > imgAR) {
         height = this.zoom.value * imgHeight;
         width = height * imgAR;
      }
      else {
         width = this.zoom.value * imgWidth;
         height = width / imgAR;
      }
      */

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

      ctx.font = '10px sans-serif';
      ctx.fillText(Squint.url, 0, 10);

      let fontSize = isMobile ? 20 : 10;
      ctx.font = fontSize + 'px sans-serif';

      msg = imgWidth + 'x' + imgHeight;
      ctx.fillText(msg, 0, canvasHeight - (3 * fontSize + 5));

      if (this.uploader) {
         msg = 'upload: ' + this.uploader.fps.toFixed(1) + ' fps';
         ctx.fillText(msg, 0, canvasHeight - (2 * fontSize + 5));

         let bandwidth = this.uploader.bandwidth;
         if (bandwidth < 5) {
            msg = 'bandwidth: ' + this.uploader.bandwidth.toFixed(2) + ' Mbsp';
         }
         else {
            msg = 'bandwidth: ' + this.uploader.bandwidth.toFixed(1) + ' Mbsp';
         }
         ctx.fillText(msg, 0, canvasHeight - (fontSize + 5));
      }
      else {
         msg = 'download: ' + this.downloadFPS.rate.toFixed(1) + ' fps';
         ctx.fillText(msg, 0, canvasHeight - (fontSize + 5));
      }

      msg = toSizeStr(this.imgSize);
      ctx.fillText(msg, 0, canvasHeight - 5);
   }

   private onScale(scale: number, change: number) {

      // TODO: center scaling about your two fingers

      let factor = change;
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
