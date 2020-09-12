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
import { ChatPanel } from './ChatPanel';
import { BandwidthTracker } from './BandwidthTracker';
import { SquintEvent } from './SquintEvents';
import NoSleep from 'nosleep.js';
import { WebSocketFactory } from './WebSocketFactory';
import { IConnectionInfoBasic, ISquintInfo } from './SquintMessage';
import { StorageWithEvents, StorageItem } from './StorageWithEvents';

WebSocketFactory.create = (url: string) => new WebSocket(url);

export function debug(msg: string): void {
   console.error(msg);
   //alert('debug error: ' + msg);
}

interface IConstraintItem {
   constraint: AdvancedConstraintName,
   label: string,
}

export class SquintApp implements IApp {
   private handler: PointerEventHandler | undefined;
   private div: HTMLDivElement | undefined;
   private userNameMenuItemDiv: HTMLDivElement | undefined;
   private img: HTMLImageElement | undefined;
   private chatPanel: ChatPanel | undefined;
   private notificationDiv: HTMLDivElement | undefined;
   private cameraMenu: SubMenu | undefined;
   private remoteCameraMenu: SubMenu | undefined;
   private storage = new StorageWithEvents();

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
   private uploader: Uploader | null = null;
   private downloadTracker = new BandwidthTracker();

   private brightness?: Slider | undefined;
   private contrast: Slider | undefined;
   private saturate: Slider | undefined;
   private blur: Slider | undefined;
   private zoom: Slider | undefined;
   private jpegQuality: Slider | undefined;
   private cameraScale: Slider | undefined;
   private cameraCtrls: ICtrl[] = [];

   private advancedConstraints: IAdvancedConstraint[] = [];
   private advancedSubMenu?: SubMenu;

   private xOffset = 0;
   private yOffset = 0;

   private squint = new Squint();

   private startDialog: StartDialog | undefined;

   private console = new ConsoleCapture();

   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
   private noSleep = new NoSleep();

   public constructor() {

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      this.noSleep.enable();

      document.title += (' ' + Version.Build);

      //localStorage.removeItem(StorageItems.UserName); // simulates starting up the first time

      this.squint.on({
         event: SquintEvent.Image,
         handler: ((blob: Blob) => { this.onDownload(blob); })
      });

      this.squint.on({
         event: SquintEvent.Close,
         handler: (() => { this.closeConnection(); })
      });

      this.squint.on({
         event: SquintEvent.ChatMessage,
         handler: ((connection, msg) => { this.onChatMessage(connection, msg); })
      });

      this.squint.on({
         event: SquintEvent.Reconnecting,
         handler: () => {
            console.log('connection lost, reconnecting...');
            this.showNotification('Connection lost, reconnecting');
         }
      });

      this.squint.on({
         event: SquintEvent.Reconnected,
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

      this.squint.on({
         event: SquintEvent.CameraRequest,
         handler: (resolution: number, jpegQuality: number) => {
            this.cameraScale.value = resolution
            this.jpegQuality.value = jpegQuality;
         }
      });

      this.squint.on({
         event: SquintEvent.HostDisconnected,
         handler: () => {
            this.drawImg();
         }
      });

      this.squint.on({
         event: SquintEvent.HostChanged,
         handler: (newHostConnectionId: string) => {
            // TODO make sure we're not calling things twice
            if (newHostConnectionId === this.squint.connectionId) {
               this.enableVideo(true);
               this.startUploader();
            }
            else {
               this.stopUploader();
               this.enableVideo(false);
            }
         }
      })

      this.console.onMessage = (msg: string) => {
         this.squint.log(msg);
      }

      this.storage.on(StorageItem.UserName, (userName) => {

         this.userNameMenuItemDiv.innerText = 'Hi ' + userName;
         this.squint.userName = userName;
      });

      document.addEventListener('visibilitychange', () => {
         if (document.visibilityState === 'visible') {
            if (this.uploader) {
               this.uploader.resume();
            }
            this.downloadTracker.resume();
         }
         else {
            if (this.uploader) {
               this.uploader.pause();
            }
            this.downloadTracker.pause();
         }
      });


      // How do you know when to close the socket? pageHide on some browsers and beforeunload/unload on
      // others. Safari seems most problematic as the actual SocketClose only randomly makes it back to
      // the server so the server doesn't know it has been a gracefull exit.
      window.addEventListener('pagehide', () => {
         if (this.squint.connected) {
            this.squint.close();
         }
      });
      window.addEventListener('beforeunload', () => {
         if (this.squint.connected) {
            this.squint.close();
         }
      });

      window.addEventListener('pageshow', () => {
         if (this.squint.connected === false) {
            this.stopUploader();
            this.enableVideo(false);
            this.startDialog.visible = true;
         }
         // TODO remove
         console.log('pageshow');
      });
      document.addEventListener('resume', () => {
         if (this.squint.connected === false) {
            this.stopUploader();
            this.enableVideo(false);
            this.startDialog.visible = true;
         }
         console.log('resume');
      });
      /*
      window.addEventListener('pageshow', () => {
         console.log('pageshow');
      });

      document.addEventListener('freeze', () => {
         console.log('freeze');
      });

      document.addEventListener('resume', () => {
         console.log('resume');
      });

      window.addEventListener('beforeunload', () => {
         console.log('beforeunload');
      });
   
      window.addEventListener('pagehide', () => {
         console.log('pagehide');
      });
   
      window.addEventListener('unload', () => {
         console.log('unload');
      });
      */

   }

   public create(div: HTMLDivElement): void {

      div.id = 'SquintApp';

      let onViewSession = (sessionId: string) => {
         this.squint.join(sessionId)
            .catch((err) => {
               alert(err);
               this.startDialog.visible = true;
            });
      };

      let onStartSession = () => {
         this.squint.createSession()
            .then(() => {
               this.enableVideo(true);
            })
            .catch((err) => {
               alert(err);
               this.startDialog.visible = true;
            })
      };

      this.startDialog = new StartDialog(
         div,
         this.squint,
         onViewSession,
         onStartSession,
         this.storage
      );


      this.div = GUI.create('div', 'BodyDiv', div);

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'Canvas';
      this.div.appendChild(this.canvas);

      this.camera = new Camera(this.div);
      this.camera.visible = false;

      this.camera.onPaused = () => {
         this.squint.cameraPaused();
      }
      this.squint.on({
         event: SquintEvent.CameraPaused,
         handler: () => {
            this.drawImg();
         }
      });

      this.chatPanel = new ChatPanel(this.squint, this.div);
      if (this.chatPanel.hasSavedSettings) {
         this.chatPanel.restoreSettings();
      }
      else {
         if (isMobile === false) {
            this.chatPanel.visible = true;
         }
      }

      this.notificationDiv = GUI.create('div', 'NotificationDiv', this.div);

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onScale = (scale: number, change: number) => this.onScale(scale, change);
      this.handler.onTranslate = (delta: Vec2) => this.onTranslate(delta);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);

      window.addEventListener('resize', () => this.onResize());
      this.updateSizes();

      if (this.storage.has(StorageItem.UserName) === false) {
         this.showWelcomeDialog();
      }
      else {
         this.startDialog.visible = true;
      }

      document.onkeydown = (event: KeyboardEvent) => {
         if (this.squint.connected && event.target instanceof HTMLInputElement === false) {
            switch (event.key) {

               case 'x':
                  // simulate killing the connection
                  this.squint.ws.close(3000);
                  break;

               case 'i': {
                  Squint.inspect(Squint.url)
                     .then((info: ISquintInfo) => {
                        let msg = '';
                        msg += 'Connections (' + info.connections.length + '):\n';
                        for (let connection of info.connections) {
                           msg += '   ' + connection.userName + ' ' + connection.state + '\n';
                        }
                        msg += 'Sessions (' + info.sessions.length + '):\n';
                        for (let session of info.sessions) {
                           msg += '   ' + session.title + ' host=' + session.host.userName + ' ' + session.host.state + '\n';

                           msg += '   Viewers (' + session.viewers.length + '):\n';
                           for (let connection of session.viewers) {
                              msg += '      ' + connection.userName + ' ' + connection.state;
                           }
                        }

                        alert(msg);
                     })
                     .catch((err) => {
                        debug('Squint.inspect() failed: ' + err);
                     });
               }
                  break;

               case '1':
                  if (event.altKey) {
                     this.remoteCameraMenu.hidden = !this.remoteCameraMenu.hidden;
                  }
                  break;
            }
         }
      }
   }

   private showWelcomeDialog(): void {
      const welcomeDialog = new WelcomeDialog(this.div, (userName) => {
         this.storage.set(StorageItem.UserName, userName);
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
      if (this.uploader === null) {
         this.uploader = new Uploader(
            this.squint,
            () => this.takePicture()
         );
      }
   }

   private stopUploader(): void {
      if (this.uploader) {
         this.uploader.stop();
         this.uploader = null;
      }
   }




   private enableCameraCtrls(flag: boolean) {
      this.cameraMenu.enabled = flag;
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

      // thank you Safari
      try {
         if (!CanvasRenderingContext2D.prototype.filter) {
            this.blur.enabled = false;
         }
      }
      catch (err) {
      }

      this.zoom = viewMenu.addSlider({
         label: 'Zoom',
         min: 1,
         max: 5,
         value: 1,
         oninput: () => this.drawImg(),
         onGetText: (slider) => (100 * slider.value).toFixed(0) + '%',
      });








      this.cameraMenu = menubar.addSubMenu('Camera');

      // TODO just fully disable all the menu items instead of the menu itself.
      this.cameraMenu.enabled = false;

      let firstItem = true;
      Camera.getCameras((constraint) => {

         const radioButton = this.cameraMenu.addRadiobutton(
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

      this.cameraMenu.addItem('Capabilities...', () => {
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

      this.jpegQuality = this.cameraMenu.addSlider({
         label: 'JPeg Photo Quality',
         min: 0.1,
         max: 1,
         value: 0.5,
         onGetText: (slider) => (100 * slider.value).toFixed() + '%',
      });
      this.cameraCtrls.push(this.jpegQuality);

      this.cameraScale = this.cameraMenu.addSlider({
         label: 'Camera Resolution',
         min: 0.1,
         max: 1,
         value: 1, // will automatically get scaled down when the camera starts
         onGetText: (slider) => (100 * slider.value).toFixed() + '%',
      });
      this.cameraCtrls.push(this.cameraScale);

      this.advancedSubMenu = this.cameraMenu.addSubMenu('Advanced');

      this.enableCameraCtrls(false);

      const sessionMenu = menubar.addSubMenu('Session');

      sessionMenu.addItem('End', () => {
         this.closeConnection();
      });

      sessionMenu.addItem('Make me Host', () => {
         this.squint.requestToBeHost();
      });

      sessionMenu.addCheckbox({
         label: 'Viewers/Chat',
         oncheck: (checkbox) => { this.chatPanel.visible = checkbox.checked },
         checked: () => { return this.chatPanel.visible; }
      });

      sessionMenu.addCheckbox({
         label: 'Logs',
         oncheck: (checkbox) => { this.console.visible = checkbox.checked },
         checked: () => { return this.console.visible; }
      });





      this.remoteCameraMenu = menubar.addSubMenu('Remote Camera');
      this.remoteCameraMenu.hidden = true;
      const remoteJpegQuality = this.remoteCameraMenu.addSlider({
         label: 'JPeg Photo Quality',
         min: 0.1,
         max: 1,
         value: 0.5,
         onGetText: (slider) => (100 * slider.value).toFixed() + '%',
         oninput: () => {
            this.squint.sendCameraRequest(remoteResolution.value, remoteJpegQuality.value);
         }
      });

      const remoteResolution = this.remoteCameraMenu.addSlider({
         label: 'Camera Resolution',
         min: 0.1,
         max: 1,
         value: 0.5,
         onGetText: (slider) => (100 * slider.value).toFixed() + '%',
         oninput: () => {
            this.squint.sendCameraRequest(remoteResolution.value, remoteJpegQuality.value);
         }
      });






      this.userNameMenuItemDiv = menubar.addItem(
         'Hi ' + (this.storage.has(StorageItem.UserName) ? this.storage.get(StorageItem.UserName) : ''),
         () => {
            new UserNameDialog(this.div, this.storage);
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
            this.downloadTracker.tick(blob.size);

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

      // getCapabilities() not supported on Firefox
      if (track.getCapabilities) {
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
         this.camera.visible = true;
         this.camera.start(this.desired)
            .then((track: MediaStreamTrack) => {
               const settings = track.getSettings();
               const desiredMP = 1.25 * 1000000;
               const maxMP = settings.width * settings.height;
               if (maxMP > desiredMP) {
                  this.cameraScale.value = Math.sqrt(desiredMP / maxMP);
               }

               this.updateVideoSize(settings.width, settings.height);

               this.buildAdvancedSubMenu(track);
               this.updateVideoSize(this.camera.videoWidth, this.camera.videoHeight);

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
         this.camera.visible = false;
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
      if (this.camera.visible) {
         const videoSize = Math.max(this.camera.clientWidth, this.camera.clientHeight);
         if (videoWidth > videoHeight) {
            this.camera.width = videoSize + 'px';
            this.camera.height = (videoSize * videoHeight / videoWidth) + 'px';
         }
         else {
            this.camera.height = videoSize + 'px';
            this.camera.width = (videoSize * videoWidth / videoHeight) + 'px';
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

      if (ctx.filter) {
         ctx.filter =
            'contrast(' + this.contrast.value + '%) ' +
            'brightness(' + this.brightness.value + '%) ' +
            'saturate(' + this.saturate.value + '%) ' +
            'blur(' + this.blur.value + 'px) ';
      }

      ctx.drawImage(this.img, x, y, width, height);

      // if filters are not supported on contexts, ummm Safari, do our own
      if (ctx.filter === undefined) {
         let imageData = ctx.getImageData(x, y, width, height);
         let data = imageData.data;

         if (this.contrast.value !== 100) {
            let amount = this.contrast.value / 100;
            for (let i = 0; i < data.length; i += 4) {
               data[i + 0] = ((((data[i + 0] / 255) - .5) * amount) + .5) * 255;
               data[i + 1] = ((((data[i + 1] / 255) - .5) * amount) + .5) * 255;
               data[i + 2] = ((((data[i + 2] / 255) - .5) * amount) + .5) * 255;
            }
         }

         if (this.brightness.value !== 100) {
            let amount = this.brightness.value / 100;
            for (let i = 0; i < data.length; i += 4) {
               data[i + 0] *= amount;
               data[i + 1] *= amount;
               data[i + 2] *= amount;
            }
         }

         if (this.saturate.value !== 100) {
            let amount = this.saturate.value / 100;
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
         ctx.putImageData(imageData, x, y);
      }


      let msg: string;

      const fontSize = isMobile ? 20 : 10;
      ctx.fillStyle = 'black';
      ctx.font = fontSize + 'px sans-serif';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'white';
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // squint server url
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(Squint.url, 5, 5);


      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';

      // image size
      msg = imgWidth + 'x' + imgHeight;
      ctx.fillText(msg, 5, canvasHeight - (4 * fontSize + 5));

      // image size
      const mp = (imgWidth * imgHeight / 1000000);
      if (mp < 1.5) {
         msg = mp.toFixed(2) + 'MP';
      }
      else {
         msg = mp.toFixed(1) + 'MP';
      }
      ctx.fillText(msg, 5, canvasHeight - (3 * fontSize + 5));

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

      // FPS
      msg = fps.toFixed(1) + ' fps';
      ctx.fillText(msg, 5, canvasHeight - (2 * fontSize + 5));

      // bandwidth
      if (bandwidth < 5) {
         msg = bandwidth.toFixed(2) + ' Mbsp';
      }
      else {
         msg = bandwidth.toFixed(1) + ' Mbsp';
      }
      ctx.fillText(msg, 5, canvasHeight - (fontSize + 5));

      // bytes
      msg = toSizeStr(this.downloadTracker.lastTransferBytes);
      ctx.fillText(msg, 5, canvasHeight - 5);

      // paused message
      if (this.squint.remoteCameraPaused || this.squint.remoteCameraConnected === false) {
         ctx.shadowBlur = 0;

         ctx.fillStyle = 'rgba(0,0,0,0.5)';
         ctx.fillRect(0, 0, canvasWidth, canvasHeight);

         let fontSize = 10;
         ctx.font = fontSize + 'px sans-serif';
         let msg;
         if (this.squint.remoteCameraConnected === false) {
            msg = 'Camera Disconnected';
         }
         else {
            msg = 'Camera Paused';
         }
         const textMetrics = ctx.measureText(msg);
         fontSize *= (0.8 * width / textMetrics.width);
         ctx.font = fontSize + 'px sans-serif';

         ctx.fillStyle = 'rgba(255,255,255,0.5)';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText(msg, canvasWidth / 2, canvasHeight / 2);
      }
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

   private onChatMessage(connection: IConnectionInfoBasic, msg: string) {
      this.showNotification('<b>' + connection.userName + '</b>: ' + msg);
   }

   private showNotification(html: string) {
      this.notificationDiv.innerHTML = html;

      // force the animation to run by removing and adding the element
      this.div.removeChild(this.notificationDiv);
      this.div.appendChild(this.notificationDiv);
   }
}
