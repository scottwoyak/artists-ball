import { debug, SquintStrings } from "./SquintApp";
import { iOS } from "../../Util/Globals";

export interface IVideoConstraint {
   label: string,
   width?: number,
   height?: number,
   frameRate?: number,
   deviceId: string,
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
   constraint: AdvancedConstraintName,
   value: (() => string) | (() => number),
}

export interface IMediaSettingsRange {
   min: number,
   max: number,
   step?: number,
}

export interface IVideoTrackAdvancedSettings {

   [index: string]: AdvancedConstraintMode | number;

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

   [index: string]: IMediaSettingsRange | string[];

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

export class Camera {

   private canvas: HTMLCanvasElement;
   public readonly video: HTMLVideoElement;

   public constructor(parent: HTMLElement) {
      this.canvas = document.createElement('canvas');

      this.video = document.createElement('video');
      this.video.id = 'Video';
      this.video.autoplay = true;
      this.video.setAttribute('playsinline', 'true'); // needed for iPhones
      this.video.onerror = (err) => {
         alert('video.onerror(): ' + err);
      }
      parent.appendChild(this.video);
   }

   public takePicture(
      scale: number,
      jpegQuality: number
   ): Promise<Blob> {

      if (this.video.readyState != 4) {
         console.log('xxx camera not ready');
         return Promise.reject(SquintStrings.CAMERA_NOT_READY);
      }
      console.log('video ready state: ' + this.video.readyState);

      if (this.video.videoHeight === 0 || this.video.videoWidth === 0) {
         return Promise.reject('XX Video Size = 0');
      }

      console.log('xxx setting canvas size: ' + scale + ' ' + this.video.videoWidth * scale + 'x' + this.video.videoHeight * scale);
      this.canvas.width = this.video.videoWidth * scale;
      this.canvas.height = this.video.videoHeight * scale;

      console.log('xxx draw image');
      const context = this.canvas.getContext('2d');
      console.log('xxx got context');
      context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
      console.log('xxx drawImage success');

      return new Promise<Blob>((resolve, reject) => {
         console.log('xxx canvasToBlob ' + jpegQuality);
         this.canvas.toBlob(
            (blob) => {
               resolve(blob)
            },
            'image/jpeg',
            jpegQuality);
      });
   }

   public start(desired: MediaTrackConstraints): Promise<MediaStreamTrack> {

      let constraints: any;
      if (desired.deviceId && desired.deviceId.toString().trim().length > 0) {
         constraints = {
            video: {
               width: { ideal: 10 * 1000 },
               height: { ideal: 10 * 1000 },
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

                  let track = stream.getVideoTracks()[0];

                  console.log('xxx playing video');
                  this.video.play()
                     .then(() => {
                        console.log('xxx play()');
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

   public stop() {
      console.log('xxx stopping camera');
      if (this.video.srcObject) {
         // Using the camera is not robust. Applying constraints to change things
         // like which camera is in use only works sometimes. The most robust I can
         // make it is to close the video element and create a new one.
         let stream = this.video.srcObject as MediaStream;
         stream.getTracks().forEach((track: MediaStreamTrack) => {
            track.stop();
         });

         console.log('video state after stop: ' + this.video.readyState);
      }
   }

   public applyAdvancedConstraints(advancedConstraints: IAdvancedConstraint[]) {
      let stream = this.video.srcObject as MediaStream;
      let track = stream.getVideoTracks()[0];

      let constraints = { advanced: [] = [] } as any;
      let constraint: any = {};
      for (let item of advancedConstraints) {
         constraint[item.constraint] = item.value();
      }

      console.log('setting advanced constraints: ' + JSON.stringify(constraint, null, ' '));
      constraints.advanced.push(constraint);

      track.applyConstraints(<MediaTrackConstraints><any>(constraints))
         .catch((err) => {
            debug('Cannot apply constraints: ' + err);
         });
   }

   public getCapabilities(): MediaTrackCapabilities {
      if (this.video.srcObject) {
         let stream = this.video.srcObject as MediaStream;
         let track = stream.getVideoTracks()[0];
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
      let obj = (<any>capabilities)[name];
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

   public static getCameras(onFound: (resolution: IVideoConstraint) => void) {
      navigator.mediaDevices.enumerateDevices()
         .then((devices) => {
            if (iOS() && Camera.videoEnabled === false) {

               // iPhones and iPads don't allow you to enumerate cameras until the user
               // has given permission and that doesn't happen until the first time
               // we try to use one. 
               // TODO make this work on iPhones without the if statement
               onFound({
                  label: 'Front Camera',
                  facingMode: 'user',
                  deviceId: undefined,
               });

               onFound({
                  label: 'Back Camera',
                  facingMode: 'environment',
                  deviceId: undefined,
               });

            }
            else {
               let str = '';
               let count = 0;
               for (let i = 0; i < devices.length; i++) {
                  let device = devices[i];
                  if (device.kind === 'videoinput') {
                     count++;
                     str += '"' + device.deviceId + '": ' + device.label + '\n';
                  }
               }
               str = count + ' cameras found.\n' + str;
               console.log('enumerateDevices()\n' + str);

               let cameraCount = 1;
               for (let i = 0; i < devices.length; i++) {
                  let device = devices[i];
                  if (device.kind === 'videoinput') {

                     let actual = {
                        label: 'camera ' + cameraCount++,
                        deviceId: device.deviceId,
                     }

                     onFound(actual)
                  }
               }
            }
         })
         .catch((err) => {
            debug('Cannot enumerate video devices: ' + err);
         });
   }
}
