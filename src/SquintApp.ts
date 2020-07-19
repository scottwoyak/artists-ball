import { PointerEventHandler } from "./PointerEventHandler";
import { IApp } from "./IApp";
import { Menubar } from "./Menu";
import { Slider } from "./Slider";
import { Vec2 } from "./Vec";
import { Video, IVideoResolution } from "./Video";
import { Downloader } from "./Downloader";
import { Uploader } from "./Uploader";
import { getTimeStr, getSizeStr, isMobile } from "./Globals";
import { Squint, ISessions } from "./Squint";
import { ListBox } from "./ListBox";
import { ICtrl } from "./ICtrl";

// TODO: disable camera radio buttons
// - check into camera being in use
// - add a close session button

export function debug(msg: string): void {
   console.log(msg);
   //alert('debug: ' + msg);
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
   private downloader = new Downloader();
   private uploader = new Uploader();

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

   public constructor() {
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

      this.squint.listSessions()
         .then((value) => {
            this.updateList(value);
         });

      let buttonDiv = document.createElement('div');
      buttonDiv.className = 'ButtonDiv';
      viewDiv.appendChild(buttonDiv);

      let viewButton = document.createElement('button');
      viewButton.id = 'ViewButton';
      viewButton.innerText = 'Go';
      buttonDiv.appendChild(viewButton);

      viewButton.onclick = () => {
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

      let nameInputText = document.createElement('input');
      nameInputText.type = 'text';
      nameInputText.id = 'NameInputText';
      nameInputText.placeholder = 'Your Name';
      cameraNameDiv.appendChild(nameInputText);
      nameInputText.oninput = () => {
         okButton.disabled = (nameInputText.value.trim().length === 0);
      };

      buttonDiv = document.createElement('div');
      buttonDiv.classList.add('ButtonDiv', 'NoStretch');
      hostPanelDiv.appendChild(buttonDiv);

      let okButton = document.createElement('button');
      okButton.id = 'HostOkButton';
      okButton.innerText = 'Go';
      okButton.disabled = true;
      buttonDiv.appendChild(okButton);

      okButton.onclick = () => {
         this.squint.createSession(nameInputText.value)
            .then((id) => {
               this.sessionId = id;
               this.enableVideo(true);
               this.showStartDialog(false);
            })
            .catch((err) => {
               alert('could not create session: ' + err);
            });
      }

      return backgroundDiv
   }

   private updateList(value: ISessions) {
      this.viewListBox.clear();
      for (let i = 0; i < value.sessions.length; i++) {
         this.viewListBox.addItem(value.sessions[i].name, value.sessions[i].id);
      }
      this.squint.listSessions(value.responseId)
         .then((value) => {
            this.updateList(value);
         });
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

      cameraMenu.addItem('Stop', () => {
         this.enableVideo(false);
         this.showStartDialog();
      });

      let firstItem = true;
      Video.getResolutions((resolution) => {
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

   private killVideo() {
      if (this.video) {
         // Using the camera is not robust. Applying constraints to change things
         // like which camera is in use only works sometimes. The most robust I can
         // make it is to close the video element and create a new one.
         this.video.pause();
         this.video.srcObject = null;
         this.video.parentElement.removeChild(this.video);
         this.video.load();
         this.video = null;
      }
   }

   private enableVideo(enable: boolean) {

      this.enableCameraCtrls(enable);

      if (enable) {

         // it seems you have to fully kill the video to switch cameras. This
         // set of APIs is not that robust it seems
         this.killVideo();

         const constraints = {
            video: {
               width: this.desired.width,
               height: this.desired.height,
               deviceId: { exact: this.desired.deviceId },
            }
         };

         if (this.video) {
            let stream = this.video.srcObject as MediaStream;
            let track = stream.getVideoTracks()[0];
            track.applyConstraints(constraints.video)
               .catch((err) => {
                  alert('Cannot change camera: ' + err);
               })
         }
         else {
            this.video = document.createElement('video');
            this.video.autoplay = true;
            this.video.style.display = 'none';
            this.div.appendChild(this.video);

            this.video.onplay = () => {
               this.uploader.start(this.sessionId);
               this.downloader.start(this.sessionId);
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
         this.downloader.stop();

         this.killVideo();
      }
   }

   private takePicture(): Promise<Blob> {
      let canvas = document.createElement('canvas');
      canvas.width = this.video.videoWidth * (this.resolution.value / 100);
      canvas.height = this.video.videoHeight * (this.resolution.value / 100);

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
