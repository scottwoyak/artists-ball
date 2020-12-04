/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { debug } from './SquintApp';
import { getEmPixels, iOS, pxToNumber } from '../../Util/Globals';
import { SquintStrings } from './SquintStrings';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { Vec2 } from '../../Util3D/Vec';
import { RectHit, Rect } from './Rect';

export enum CameraRotation {
   DEG_0 = 0,
   DEG_90 = Math.PI / 2,
   DEG_180 = Math.PI,
   DEG_270 = 3 * Math.PI / 2,
}

export interface IVideoConstraint {
   label: string,
   width?: number,
   height?: number,
   frameRate?: number,
   deviceId?: string,
   facingMode?: string,
}

export type AdvancedConstraintMode = 'manual' | 'continuous';

export type AdvancedConstraintName =
   'whiteBalanceMode' |
   'colorTemperature' |
   'exposureMode' |
   'exposureCompensation' |
   'exposureTime' |
   'focusMode' |
   'focusDistance' |
   'iso' |
   'zoom';

export interface IAdvancedConstraint {
   [index: string]: string | (() => string) | (() => number);
   constraint: string; //AdvancedConstraintName,
   value: (() => string) | (() => number),
}

export interface IAdvancedConstraintValue {
   [index: string]: string | number;
   constraint: string; //AdvancedConstraintName,
   value: string | number,
}

export interface IMediaSettingsRange {
   min: number,
   max: number,
   step?: number,
}

export interface IAdvancedConstraintObject {
   [index: string]: AdvancedConstraintMode | number | undefined;
}

export interface IVideoTrackAdvancedSettings extends IAdvancedConstraintObject {

   whiteBalanceMode?: AdvancedConstraintMode;
   colorTemperature?: number;

   exposureMode?: AdvancedConstraintMode;
   exposureCompensation?: number; // a.k.a f-stop
   exposureTime?: number;

   focusMode?: AdvancedConstraintMode;
   focusDistance?: number;

   iso?: number;
   zoom?: number;
}

export interface IVideoTrackAdvancedCapabilities {

   [index: string]: IMediaSettingsRange | string[] | undefined;

   whiteBalanceMode?: string[];
   colorTemperature?: IMediaSettingsRange;

   exposureMode?: string[];
   exposureCompensation?: IMediaSettingsRange; // a.k.a f-stop
   exposureTime?: IMediaSettingsRange;

   focusMode?: string[];
   focusDistance?: IMediaSettingsRange;

   iso?: IMediaSettingsRange;
   zoom?: IMediaSettingsRange;
}

export type CameraPauseResumeHandler = () => void;

export class Camera {

   private hiddenCanvas: HTMLCanvasElement;
   private video: HTMLVideoElement;
   private overlayCanvas: HTMLCanvasElement;

   // the area of the camera that we capture in a photo
   public capture = new Rect();

   public onPaused: CameraPauseResumeHandler | null = null;
   public onResume: CameraPauseResumeHandler | null = null;

   public get paused(): boolean {
      return (document.visibilityState !== 'visible');
   }

   public get videoWidth(): number {
      return this.video.videoWidth;
   }
   public get videoHeight(): number {
      return this.video.videoHeight;
   }

   public get clientWidth(): number {
      return this.video.clientWidth;
   }
   public get clientHeight(): number {
      return this.video.clientHeight;
   }

   private get offset(): number {
      let style = getComputedStyle(this.video);
      return pxToNumber(style.borderWidth) + pxToNumber(style.margin);
   }

   public rotation = CameraRotation.DEG_0;

   public set width(value: number) {
      this.video.style.width = value + 'px';
      this.overlayCanvas.style.width = (value + 2 * this.offset) + 'px';
   }
   public set height(value: number) {
      this.video.style.height = value + 'px';
      this.overlayCanvas.style.height = (value + 2 * this.offset) + 'px';
   }

   public get visible(): boolean {
      return (getComputedStyle(this.video).display !== 'none');
   }
   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.video.style.display = 'block';
         this.overlayCanvas.style.display = 'block';
      }
      else {
         this.video.style.display = 'none';
         this.overlayCanvas.style.display = 'none';
      }
   }


   public constructor(parent: HTMLElement) {
      this.hiddenCanvas = document.createElement('canvas');

      this.video = document.createElement('video');
      this.video.id = 'Video';
      this.video.autoplay = true;
      this.video.setAttribute('playsinline', 'true'); // needed for iPhones
      this.video.onerror = (err) => {
         alert('video.onerror(): ' + err);
      }
      parent.appendChild(this.video);

      this.overlayCanvas = document.createElement('canvas');
      this.overlayCanvas.id = 'VideoOverlay';
      parent.appendChild(this.overlayCanvas);

      let handler = new PointerEventHandler(this.overlayCanvas);

      let hit = RectHit.None;
      handler.onDown = (pos: Vec2) => {
         hit = this.getHit(pos);
      }

      handler.onMove = (pos: Vec2) => {
         let hit = this.getHit(pos);
         switch (hit) {
            case RectHit.UL:
               this.overlayCanvas.style.cursor = 'nwse-resize';
               break;
            case RectHit.UR:
               this.overlayCanvas.style.cursor = 'nesw-resize';
               break;
            case RectHit.LL:
               this.overlayCanvas.style.cursor = 'nesw-resize';
               break;
            case RectHit.LR:
               this.overlayCanvas.style.cursor = 'nwse-resize';
               break;
            case RectHit.Inside:
               if (this.capture.width < this.videoWidth || this.capture.height < this.videoHeight) {
                  this.overlayCanvas.style.cursor = 'move';
               }
               else {
                  this.overlayCanvas.style.cursor = 'default';
               }
               break;
            case RectHit.None:
               this.overlayCanvas.style.cursor = 'default';
               break;
         }
      }

      handler.onDrag = (pos: Vec2, delta: Vec2) => {
         let ratio = this.videoWidth / this.clientWidth;
         delta.x *= ratio;
         delta.y *= ratio;
         let min = 200;

         // check for limits
         if (hit === RectHit.UL || hit === RectHit.LL || hit === RectHit.Inside) {
            if (this.capture.width - delta.x < min) {
               delta.x = this.capture.width - min;
            }
            if (this.capture.x + delta.x < 0) {
               delta.x = -this.capture.x;
            }
         }
         if (hit === RectHit.UR || hit === RectHit.LR || hit === RectHit.Inside) {
            if (this.capture.right + delta.x > this.videoWidth) {
               delta.x = this.videoWidth - this.capture.right;
            }
            if (this.capture.width + delta.x < min) {
               delta.x = min - this.capture.width;
            }
         }
         if (hit === RectHit.UL || hit === RectHit.UR || hit === RectHit.Inside) {
            if (this.capture.y + delta.y + min > this.capture.bottom) {
               delta.y = this.capture.bottom - this.capture.y - min;
            }
            if (this.capture.y + delta.y < 0) {
               delta.y = -this.capture.y;
            }
         }
         if (hit === RectHit.LL || hit === RectHit.LR || hit === RectHit.Inside) {
            if (this.capture.height + delta.y < min) {
               delta.y = min - this.capture.height;
            }
            if (this.capture.bottom + delta.y > this.videoHeight) {
               delta.y = this.videoHeight - this.capture.bottom;
            }
         }

         // do the move
         switch (hit) {
            case RectHit.UL:
               this.capture.x += delta.x;
               this.capture.y += delta.y;
               this.capture.width -= delta.x;
               this.capture.height -= delta.y;
               this.drawOverlay();
               break;
            case RectHit.UR:
               this.capture.y += delta.y;
               this.capture.width += delta.x;
               this.capture.height -= delta.y;
               this.drawOverlay();
               break;
            case RectHit.LL:
               this.capture.x += delta.x;
               this.capture.width -= delta.x;
               this.capture.height += delta.y;
               this.drawOverlay();
               break;
            case RectHit.LR:
               this.capture.width += delta.x;
               this.capture.height += delta.y;
               this.drawOverlay();
               break;
            case RectHit.Inside:
               this.capture.x += delta.x;
               this.capture.y += delta.y;
               break;
         }
      }

      document.addEventListener('visibilitychange', () => {
         if (this.visible) {
            if (document.visibilityState === 'visible') {
               if (this.onResume) {
                  this.onResume();
               }
            }
            else {
               if (this.onPaused) {
                  this.onPaused();
               }
            }
         }
      });

      /*
      window.addEventListener('orientationchange', () => {
         this.capture.x = 0;
         this.capture.y = 0;
         this.capture.width = this.videoWidth;
         this.capture.height = this.videoHeight;
         let rect = this.video.getBoundingClientRect();
         this.overlayCanvas.style.left = rect.left + 'px';
         this.overlayCanvas.style.right = rect.right + 'px';
         this.overlayCanvas.style.top = rect.top + 'px';
         this.overlayCanvas.style.bottom = rect.bottom + 'px';
      });
      */
   }

   private getHit(pos: Vec2): RectHit {
      let scale = this.clientWidth / this.videoWidth;
      let rect = this.capture.getScaled(scale);
      let offset = this.offset;
      rect.x += offset;
      rect.y += offset;

      let radius = 0.5 * getEmPixels();
      let epsilon = 3 * radius;
      return rect.hit(pos, epsilon);
   }

   private drawOverlay(): void {
      let ctx = this.overlayCanvas.getContext('2d');
      let w = this.overlayCanvas.width;
      let h = this.overlayCanvas.height;
      let m = getEmPixels();

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(m, m, w - 2 * m, h - 2 * m);

      let scale = this.video.clientWidth / this.video.videoWidth;
      let rect = this.capture.getScaled(scale);
      ctx.clearRect(m + rect.x, m + rect.y, rect.width, rect.height);

      // handles
      ctx.fillStyle = 'lightgreen';
      ctx.strokeStyle = 'darkgreen'
      let radius = 0.5 * getEmPixels();

      ctx.beginPath();
      ctx.arc(m + rect.left, m + rect.top, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m + rect.right, m + rect.top, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m + rect.left, m + rect.bottom, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(m + rect.right, m + rect.bottom, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
   }

   public takePicture(
      megaPixels: number,
      jpegQuality: number
   ): Promise<Blob | null> {

      if (this.video.readyState != 4) {
         return Promise.reject(SquintStrings.CAMERA_NOT_READY);
      }
      if (this.paused) {
         return Promise.reject(SquintStrings.CAMERA_NOT_READY);
      }

      if (this.video.videoHeight === 0 || this.video.videoWidth === 0) {
         return Promise.reject('XX Video Size = 0');
      }

      this.overlayCanvas.width = this.overlayCanvas.clientWidth;
      this.overlayCanvas.height = this.overlayCanvas.clientHeight;

      this.drawOverlay();

      let scale = Math.min(Math.sqrt(1000000 * megaPixels / (this.capture.width * this.capture.height)), 1);
      let imgWidth = this.capture.width * scale;
      let imgHeight = this.capture.height * scale;

      if (this.rotation === CameraRotation.DEG_0 || this.rotation === CameraRotation.DEG_180) {
         this.hiddenCanvas.width = imgWidth;
         this.hiddenCanvas.height = imgHeight;
      }
      else {
         this.hiddenCanvas.width = imgHeight;
         this.hiddenCanvas.height = imgWidth;
      }

      const context = this.hiddenCanvas.getContext('2d');
      if (context === null) {
         debug('Cannot get context 2D');
         return Promise.reject(SquintStrings.CAMERA_NOT_READY);
      }

      context.rotate(this.rotation);

      switch (this.rotation) {
         case CameraRotation.DEG_0:
            break;

         case CameraRotation.DEG_90:
            context.translate(0, -imgHeight);
            break;

         case CameraRotation.DEG_180:
            context.translate(-imgWidth, -imgHeight);
            break;

         case CameraRotation.DEG_270:
            context.translate(-imgWidth, 0);
            break;
      }

      context.drawImage(
         this.video,
         this.capture.x,
         this.capture.y,
         this.capture.width,
         this.capture.height,
         0,
         0,
         imgWidth,
         imgHeight);

      return new Promise<Blob | null>((resolve, reject) => {
         this.hiddenCanvas.toBlob(
            (blob) => {
               // the camera could have stopped since we started this
               // process. If so, abandon the result as we don't know
               // when the camera went off
               if (this.video.readyState != 4) {
                  return reject(SquintStrings.CAMERA_NOT_READY);
               }
               else if (this.paused) {
                  return reject(SquintStrings.CAMERA_NOT_READY);
               }
               else {
                  resolve(blob)
               }
            },
            'image/jpeg',
            jpegQuality);
      });
   }

   public takePicture2(
      megaPixels: number
   ): ImageData {

      if (this.video.readyState != 4) {
         return null;
         //return Promise.reject(SquintStrings.CAMERA_NOT_READY);
      }
      if (this.paused) {
         return null;
         //return Promise.reject(SquintStrings.CAMERA_NOT_READY);
      }

      if (this.video.videoHeight === 0 || this.video.videoWidth === 0) {
         return null;
         //return Promise.reject('XX Video Size = 0');
      }

      this.overlayCanvas.width = this.overlayCanvas.clientWidth;
      this.overlayCanvas.height = this.overlayCanvas.clientHeight;

      this.drawOverlay();

      let scale = Math.min(Math.sqrt(1000000 * megaPixels / (this.capture.width * this.capture.height)), 1);
      this.hiddenCanvas.width = this.capture.width * scale;
      this.hiddenCanvas.height = this.capture.height * scale;

      const context = this.hiddenCanvas.getContext('2d');
      if (context === null) {
         return null;
         //return Promise.reject(SquintStrings.CAMERA_NOT_READY);
      }

      context.drawImage(
         this.video,
         this.capture.x,
         this.capture.y,
         this.capture.width,
         this.capture.height,
         0,
         0,
         this.hiddenCanvas.width,
         this.hiddenCanvas.height);

      return context.getImageData(0, 0, this.hiddenCanvas.width, this.hiddenCanvas.height);
   }

   public start(desired: MediaTrackConstraints): Promise<MediaStreamTrack> {

      let constraints: MediaStreamConstraints;
      if (desired.deviceId && desired.deviceId.toString().trim().length > 0) {
         constraints = {
            video: {
               width: { ideal: desired.width? desired.width as number: 10*1000 },
               height: { ideal: desired.height? desired.height as number: 10*1000 },
               facingMode: desired.facingMode,
               deviceId: desired.deviceId,
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
               facingMode: desired.facingMode,
            },
            audio: false,
         };
      }

      return new Promise<MediaStreamTrack>((resolve, reject) => {
         navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {

               if (stream === null) {
                  reject('Could not create video stream');
               }
               else {
                  // let the Video object know that the user has know granted user permission
                  // to use the camera
                  Camera.videoEnabled = true;

                  this.video.srcObject = stream;
                  const track = stream.getVideoTracks()[0];

                  this.video.play()
                     .then(() => {
                        this.capture.x = 0;
                        this.capture.y = 0;
                        this.capture.width = this.video.videoWidth;
                        this.capture.height = this.video.videoHeight;
                        resolve(track);
                     })
                     .catch((err) => {
                        reject(err);
                     });
               }
            })
            .catch((reason) => {
               reject('Video error: ' + reason);
            });
      });
   }

   public stop(): void {
      if (this.video.srcObject) {
         // Using the camera is not robust. Applying constraints to change things
         // like which camera is in use only works sometimes. The most robust I can
         // make it is to close the video element and create a new one.
         const stream = this.video.srcObject as MediaStream;
         stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
         });
      }
   }

   public applyAdvancedConstraints(advancedConstraints: IAdvancedConstraint[]): void {
      const stream = this.video.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];

      const constraint = {} as IAdvancedConstraintValue;
      for (const item of advancedConstraints) {
         constraint[item.constraint] = item.value();
      }
      console.log('setting advanced constraints: ' + JSON.stringify(constraint, null, ' '));

      const constraints = { advanced: [constraint] };
      track.applyConstraints(<MediaTrackConstraints><any>(constraints))
         .catch((err) => {
            debug('Cannot apply constraints: ' + err);
         });
   }

   public getCapabilities(): MediaTrackCapabilities {
      if (this.video.srcObject) {
         const stream = this.video.srcObject as MediaStream;
         const track = stream.getVideoTracks()[0];
         if (track.getCapabilities) {
            return track.getCapabilities();
         }
      }

      return {};
   }

   private static numToString(num: number): string {
      if (Number.isInteger(num)) {
         return num.toString();
      }
      else {
         return num.toFixed(3);
      }
   }

   public static capabilityToString(capabilities: MediaTrackCapabilities, name: string): string {
      const obj = (<any>capabilities)[name];
      let str = name + ': ';
      if (typeof obj === 'object') {
         if (obj['min'] !== undefined) {
            str += Camera.numToString(obj['min'] as number) + ' to ' + Camera.numToString(obj['max'] as number);
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


   private static videoEnabled = false;

   public static getCameras(onFound: (resolution: IVideoConstraint, index: number, numCameras: number) => void): void {
      let index = 0;
      navigator.mediaDevices.enumerateDevices()
         .then((devices) => {

            let numCameras = 0;
            for (let i = 0; i < devices.length; i++) {
               const device = devices[i];
               // AvStream is the infared camera that isn't a camera in chrome
               if (device.kind === 'videoinput' && device.label.startsWith('AvStream Media Device') === false) {
                  numCameras++;
               }
            }

            if (iOS() && Camera.videoEnabled === false) {

               // iPhones and iPads don't allow you to enumerate cameras until the user
               // has given permission and that doesn't happen until the first time
               // we try to use one. 
               // TODO make this work on iPhones without the if statement
               onFound({
                  label: 'Front Camera',
                  facingMode: 'user',
               },
                  0,
                  2);

               onFound({
                  label: 'Back Camera',
                  facingMode: 'environment',
               },
                  1,
                  2);
            }
            else {
               let str = '';
               let count = 0;
               for (let i = 0; i < devices.length; i++) {
                  const device = devices[i];
                  if (device.kind === 'videoinput') {
                     count++;
                     str += '"' + device.deviceId + '": ' + device.label + '\n';
                  }
               }
               str = count + ' cameras found.\n' + str;
               console.log('enumerateDevices()\n' + str);

               let cameraCount = 1;
               for (let i = 0; i < devices.length; i++) {
                  const device = devices[i];
                  if (device.kind === 'videoinput' && device.label.startsWith('AvStream Media Device') === false) {
                     if (device.label.includes('INOGENI 4K')) {
                        const actual = {
                           label: 'INOGENI 4K',
                           deviceId: device.deviceId,
                           width: 2*1920,
                           height: 2*1080,
                        }

                        onFound(actual, index++, numCameras);   
                     }
                     else {
                        const actual = {
                           label: 'camera ' + cameraCount++,
                           deviceId: device.deviceId,
                        }

                        onFound(actual, index++, numCameras);   
                     }
                  }
               }
            }
         })
         .catch((err) => {
            debug('Cannot enumerate video devices: ' + err);
         });
   }
}
