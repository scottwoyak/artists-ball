import 'webrtc-adapter';
import { IApp } from '../../IApp';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { IVideoConstraint, Camera, IMediaSettingsRange, IVideoTrackAdvancedCapabilities, IVideoTrackAdvancedSettings, AdvancedConstraintName, IAdvancedConstraint } from './Camera';
import { Uploader } from './Uploader';
import { Slider } from '../../GUI/Slider';
import { ICtrl } from '../../GUI/ICtrl';
import { toSizeStr, isMobile } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { Menubar, SubMenu } from '../../GUI/Menu';
import { ConsoleCapture } from '../../Util/ConsoleCapture';
import { StartDialog } from './StartDialog';
import { Version } from './Version';
import { Squint } from './Squint';
import { WelcomeDialog } from './WelcomeDialog';
import { UserNameDialog } from './UserNameDialog';
import { GUI } from '../../GUI/GUI';
import { ViewersPanel } from './ViewersPanel';
import { IConnectionInfo } from './SquintMessage';
import { BandwidthTracker } from './BandwidthTracker';
import { SquintEvent } from './SquintEvents';

export class SquintStrings {
   public static readonly CAMERA_NOT_READY = 'Camera not ready';
}

export function debug(msg: string): void {
   console.error(msg);
   //alert('debug error: ' + msg);
}

interface IConstraintItem {
   constraint: AdvancedConstraintName,
   label: string,
}

enum StorageItems {
   UserName = 'UserName',
   VideoWindow = 'VideoWindow',
   ViewerWindow = 'ViewerWindow'
}

export class SquintApp implements IApp {
   private handler: PointerEventHandler | undefined;
   private div: HTMLDivElement | undefined;
   private userNameMenuItemDiv: HTMLDivElement | undefined;
   private img: HTMLImageElement | undefined;
   private viewersPanel: ViewersPanel | undefined;
   private notificationDiv: HTMLDivElement | undefined;

   private camera: Camera | undefined;
   private canvas: HTMLCanvasElement | undefined;
   private desired: IVideoConstraint = {
      label: '',
      width: 0,
      height: 0,
      frameRate: 0,
      facingMode: '',
      deviceId: '',
   };
   private uploader: Uploader | undefined;
   private downloadTracker = new BandwidthTracker();

   private brightness: Slider | undefined;
   private contrast: Slider | undefined;
   private saturate: Slider | undefined;
   private blur: Slider | undefined;
   private zoom: Slider | undefined;
   private jpegQuality: Slider | undefined;
   private cameraScale: Slider | undefined;
   private cameraCtrls: ICtrl[] = [];

   private advancedConstraints: IAdvancedConstraint[] = [];
   private advancedSubMenu: SubMenu;

   private xOffset = 0;
   private yOffset = 0;

   private squint: Squint;

   private startDialog: StartDialog | undefined;

   private console = new ConsoleCapture();

   private hasUserName(): boolean {
      return localStorage.getItem(StorageItems.UserName) !== null;
   }

   private get userName(): string {
      let userName = localStorage.getItem(StorageItems.UserName);
      if (userName === null) {
         userName = 'Unknown';
      }
      return userName;
   }

   private set userName(userName: string) {
      const oldUserName = this.userName;
      localStorage.setItem(StorageItems.UserName, userName);

      if (userName !== oldUserName) {
         this.userNameMenuItemDiv.innerText = 'Hi ' + userName;

         if (this.squint && this.squint.connected) {
            this.squint.updateConnectionInfo(userName);
         }
      }
   }

   public constructor() {

      document.title += (' ' + Version.Build);

      //localStorage.removeItem(StorageItems.UserName); // simulates starting up the first time

      this.squint = new Squint();
      this.squint.on({
         name: SquintEvent.Image,
         handler: ((blob: Blob) => { this.onDownload(blob); })
      });

      this.squint.on({
         name: SquintEvent.Close,
         handler: (() => { this.closeConnection(); })
      });

      this.squint.on({
         name: SquintEvent.ChatMessage,
         handler: ((connection, msg) => { this.onChatMessage(connection, msg); })
      });

      this.squint.on({
         name: SquintEvent.Reconnecting,
         handler: () => {
            console.log('connection lost, reconnecting...');
            this.showNotification('Connection lost, reconnecting');
         }
      });
      this.squint.on({
         name: SquintEvent.Reconnected,
         handler: (success: boolean) => {
            console.log('reconnected: success=' + success);

            if (success === false) {
               this.showNotification('Could not reconnect');
            }
            else {
               this.showNotification('Reconnected');
            }
         }
      });
   }

   public create(div: HTMLDivElement): void {

      div.id = 'SquintApp';

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


      this.div = GUI.create('div', 'BodyDiv', div);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.camera = new Camera(this.div);
      this.camera.video.style.display = 'none';

      this.viewersPanel = new ViewersPanel(this.squint, this.div);

      this.notificationDiv = GUI.create('div', 'NotificationDiv', this.div);

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

      window.addEventListener('resize', () => this.onResize());
      this.updateSizes();

      if (!this.hasUserName) {
         this.showWelcomeDialog();
      }
      else {
         // refresh the expiration date
         this.startDialog.visible = true;
      }

      document.onkeydown = (event: KeyboardEvent) => {
         if (this.squint.connected) {
            switch (event.key) {

               case 'x':
                  // simulate killing the connection
                  (<any>this.squint.ss).ws.close(3000);
                  break;
            }
         }
      }
   }

   private showWelcomeDialog(): void {
      const welcomeDialog = new WelcomeDialog(this.div, (userName) => {
         this.userName = userName;
         this.startDialog.visible = true;
      });
      welcomeDialog.visible = true;
   }

   public closeConnection(): void {
      if (this.squint.connected) {
         this.squint.close();
      }

      this.stopUploader();
      this.enableVideo(false);
      this.startDialog.visible = true;

      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
   }

   private startSession(): void {
      this.startUploader();
   }

   private startUploader(): void {
      this.uploader = new Uploader(
         this.squint,
         () => this.takePicture()
      );
   }

   private stopUploader(): void {
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

   public buildMenu(menubar: Menubar): void {

      const viewMenu = menubar.addSubMenu('View');

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








      const cameraMenu = menubar.addSubMenu('Camera');

      let firstItem = true;
      Camera.getCameras((constraint) => {

         const radioButton = cameraMenu.addRadiobutton(
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

      cameraMenu.addItem('Capabilities...', () => {
         const capabilities = this.camera.getCapabilities();
         let msg = 'Camera Capabilities:\n';
         for (const key in capabilities) {
            if (key === 'deviceId' || key === 'groupId') {
               continue;
            }
            msg += Camera.capabilityToString(capabilities, key) + '\n';
         }
         alert(msg);
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

      const sessionMenu = menubar.addSubMenu('Session');

      sessionMenu.addItem('Stop', () => {
         this.closeConnection();
      });

      sessionMenu.addCheckbox({
         label: 'Viewers/Chat',
         oncheck: (checkbox) => { this.viewersPanel.visible = checkbox.checked },
         checked: () => { return this.viewersPanel.visible; }
      });

      sessionMenu.addCheckbox({
         label: 'Logs',
         oncheck: (checkbox) => { this.console.visible = checkbox.checked },
         checked: () => { return this.console.visible; }
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

   private onDownload(blob: Blob) {

      if (!blob) {
         debug('onDownload() blob is null');
      }

      // let the server know we're ready for the next download
      this.squint.requestNextImage();
      this.drawBlob(blob);
   }

   private drawBlob(blob: Blob) {
      const img = document.createElement('img');

      img.src = URL.createObjectURL(blob);
      img.onload = () => {
         // TODO how do we know that this connection is the same as the one that
         // initiated the request?
         if (this.squint.connected) {
            this.img = img;
            this.downloadTracker.onTransfer(blob.size);

            this.drawImg();
         }

         URL.revokeObjectURL(img.src);
      }
      img.onerror = (reason) => {
         alert('Cannot load image: ' + reason);
      }
   }

   private buildAdvancedSubMenu(track: MediaStreamTrack) {
      this.advancedSubMenu.clear();
      this.advancedConstraints = [];

      const capabilities = track.getCapabilities() as IVideoTrackAdvancedCapabilities;
      const settings = track.getSettings() as IVideoTrackAdvancedSettings;

      const whiteBalanceMode: IConstraintItem = {
         constraint: 'whiteBalanceMode',
         label: 'Auto White Blance'
      }
      const colorTemperature: IConstraintItem = {
         constraint: 'colorTemperature',
         label: 'Temperature'
      }
      const exposureMode: IConstraintItem = {
         constraint: 'exposureMode',
         label: 'Auto Exposure'
      }
      const exposureCompensation: IConstraintItem = {
         constraint: 'exposureCompensation',
         label: 'F-Stop'
      }
      const exposureTime: IConstraintItem = {
         constraint: 'exposureTime',
         label: 'Exposure'
      }
      const iso: IConstraintItem = {
         constraint: 'iso',
         label: 'ISO'
      }
      const focusMode: IConstraintItem = {
         constraint: 'focusMode',
         label: 'Auto Focus'
      }
      const focusDistance: IConstraintItem = {
         constraint: 'focusDistance',
         label: 'Focus'
      }
      const zoom: IConstraintItem = {
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

      const sliders: Slider[] = [];
      const checkbox = this.advancedSubMenu.addCheckbox({
         label: checkboxSetup.label,
         oncheck: (checkbox) => {
            for (const slider of sliders) {
               slider.enabled = !checkbox.checked;
            }
            this.camera.applyAdvancedConstraints(this.advancedConstraints);
         },
         checked: settings[checkboxSetup.constraint] === 'continuous',
      });

      this.advancedConstraints.push({
         constraint: checkboxSetup.constraint,
         value: () => { return checkbox.checked ? 'continuous' : 'manual'; }
      });

      for (const item of sliderSetups) {

         if (capabilities[item.constraint]) {
            const slider = this.addAdvancedSlider(settings, capabilities, item);
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

      const range = capabilities[item.constraint] as IMediaSettingsRange;
      const slider = this.advancedSubMenu.addSlider({
         label: item.label,
         min: range.min,
         max: range.max,
         value: settings[item.constraint] as number,
         onGetText: (slider) => { return slider.value.toFixed(); },
         oninput: () => { this.camera.applyAdvancedConstraints(this.advancedConstraints); }
      })

      this.advancedConstraints.push({
         constraint: item.constraint,
         value: () => { return slider.value; }
      });
      return slider;
   }

   private enableVideo(enable: boolean) {

      // stop the last video
      this.camera.stop();

      this.enableCameraCtrls(enable);

      if (enable) {
         this.camera.video.style.display = 'block';
         this.camera.start(this.desired)
            .then((track: MediaStreamTrack) => {
               const settings = track.getSettings();
               if (Math.max(settings.width, settings.height) > 1000) {
                  this.cameraScale.value = Math.min(1000 / settings.width, 1000 / settings.height);
               }

               this.updateVideoSize(settings.width, settings.height);

               this.buildAdvancedSubMenu(track);
               this.updateVideoSize(this.camera.video.videoWidth, this.camera.video.videoHeight);

               if (!this.uploader) {
                  this.startSession();
               }

            })
            .catch((reason) => {
               alert(reason);
            });
      }
      else {
         this.stopUploader();
         this.camera.video.style.display = 'none';
         this.advancedSubMenu.clear();
      }
   }

   private takePicture(): Promise<Blob> {

      if (!this.squint.connected) {
         console.error('takePicture() after close');
      }

      return this.camera.takePicture(this.cameraScale.value, this.jpegQuality.value)
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
      if (getComputedStyle(this.camera.video).display !== 'none') {
         const videoSize = Math.max(this.camera.video.clientWidth, this.camera.video.clientHeight);
         if (videoWidth > videoHeight) {
            this.camera.video.style.width = videoSize + 'px';
            this.camera.video.style.height = (videoSize * videoHeight / videoWidth) + 'px';
         }
         else {
            this.camera.video.style.height = videoSize + 'px';
            this.camera.video.style.width = (videoSize * videoWidth / videoHeight) + 'px';
         }
      }
   }

   private updateSizes() {
      const menubarHeight = document.getElementById('Menubar').clientHeight;

      this.console.setEdges(0, 0, menubarHeight, 0);
      const viewWidth = document.documentElement.clientWidth;
      const viewHeight = document.documentElement.clientHeight;

      this.canvas.width = viewWidth;
      this.canvas.height = viewHeight - menubarHeight;

      if (this.squint.connected) {
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

      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      const canvasAR = canvasWidth / canvasHeight;

      const imgWidth = this.img.width;
      const imgHeight = this.img.height;
      const imgAR = imgWidth / imgHeight;

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

      const x = (canvasWidth - width) / 2.0 + this.xOffset;
      const y = (canvasHeight - height) / 2.0 - this.yOffset;

      const ctx = this.canvas.getContext('2d');
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

      const fontSize = isMobile ? 20 : 10;
      ctx.font = fontSize + 'px sans-serif';

      msg = imgWidth + 'x' + imgHeight;
      ctx.fillText(msg, 0, canvasHeight - (3 * fontSize + 5));

      let fps: number;
      let bandwidth: number;
      if (this.uploader) {
         bandwidth = this.uploader.megaBitsPerSec;
         fps = this.uploader.fps;
      }
      else {
         bandwidth = this.downloadTracker.megaBitsPerSec;
         fps = this.downloadTracker.fps;
      }

      msg = fps.toFixed(1) + ' fps';
      ctx.fillText(msg, 0, canvasHeight - (2 * fontSize + 5));

      if (bandwidth < 5) {
         msg = 'bandwidth: ' + bandwidth.toFixed(2) + ' Mbsp';
      }
      else {
         msg = 'bandwidth: ' + bandwidth.toFixed(1) + ' Mbsp';
      }
      ctx.fillText(msg, 0, canvasHeight - (fontSize + 5));

      msg = toSizeStr(this.downloadTracker.lastTransferBytes);
      ctx.fillText(msg, 0, canvasHeight - 5);
   }

   private onScale(scale: number, change: number) {

      // TODO: center scaling about your two fingers

      const factor = change;
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

   private onChatMessage(connection: IConnectionInfo, msg: string) {
      this.showNotification('<b>' + connection.userName + '</b>: ' + msg);
   }

   private showNotification(html: string) {
      this.notificationDiv.innerHTML = html;

      // force the animation to run by removing and adding the element
      this.div.removeChild(this.notificationDiv);
      this.div.appendChild(this.notificationDiv);
   }
}
