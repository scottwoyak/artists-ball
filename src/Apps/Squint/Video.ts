import { debug } from "./SquintApp";
import { iOS } from "../../Util/Globals";

export interface IVideoResolution {
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

export class Video {

   public static videoEnabled = false;

   public static getCameras(onFound: (resolution: IVideoResolution) => void) {
      navigator.mediaDevices.enumerateDevices()
         .then((devices) => {
            if (iOS() && Video.videoEnabled === false) {

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
