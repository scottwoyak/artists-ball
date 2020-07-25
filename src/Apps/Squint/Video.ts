import { debug } from "./SquintApp";

export interface IVideoResolution {
   label: string,
   width?: number,
   height?: number,
   frameRate?: number,
   deviceId: string,
   facingMode?: string,
}

export class Video {

   public static getCameras(onFound: (resolution: IVideoResolution) => void) {
      navigator.mediaDevices.enumerateDevices()
         .then((devices) => {
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
            debug('enumerateDevices()\n' + str);

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
         })
         .catch((err) => {
            debug('Cannot enumerate video devices: ' + err);
         });
   }
}
