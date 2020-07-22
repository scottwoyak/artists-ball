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

   public static getResolutions(onFound: (resolution: IVideoResolution) => void) {
      navigator.mediaDevices.enumerateDevices()
         .then((devices) => {
            /*
            let str = '';
            let count = 0;
            for (let i = 0; i < devices.length; i++) {
               let device = devices[i];
               if (device.kind === 'videoinput') {
                  count++;
                  str += device.deviceId + ': ' + device.label + '\n';
               }
            }
            str = count + ' cameras found.\n' + str;
            alert(str);
            */

            let cameraCount = 1;
            for (let i = 0; i < devices.length; i++) {
               let device = devices[i];
               if (device.kind === 'videoinput') {

                  let actual = {
                     label: 'camera ' + cameraCount++,
                     // if we don't ask for an initial size, Chrome will initialize
                     // the camera with a lower one and then this resolution sticks
                     // until the camera turns off. Ask for the highest possible.
                     //width: 10 * 1024,
                     //height: 10 * 1024,
                     deviceId: device.deviceId,
                  }

                  onFound(actual)

                  /*

                  const constraints = {
                     video:
                     {
                        // if we don't ask for an initial size, Chrome will initialize
                        // the camera with a lower one and then this resolution sticks
                        // until the camera turns off. Ask for the highest possible.
                        width: 10 * 1024,
                        height: 10 * 1024,
                        //frameRate: 30,
                        deviceId: device.deviceId,
                     }
                  };

                  navigator.mediaDevices.getUserMedia(constraints)
                     .then((stream) => {
                        let mediaTrack = stream.getVideoTracks()[0];
                        let constraints = mediaTrack.getConstraints();
                        let settings = mediaTrack.getSettings();

                        if (mediaTrack.getCapabilities) {
                           let capabilities = mediaTrack.getCapabilities(); // not supported by firefox

                           let cam = (settings.facingMode === 'user' ? 'Front' : 'Back');
                           let maxWidth = capabilities.width.max;
                           let maxHeight = capabilities.height.max;
                           let actual = {
                              label: cam + ' (' + maxWidth + 'x' + maxHeight + ')',
                              width: maxWidth,
                              height: maxHeight,
                              facingMode: capabilities.facingMode[0],
                              frameRate: 30,
                              deviceId: capabilities.deviceId,
                           }

                           onFound(actual)
                        }
                        else {
                           let cam = (settings.facingMode === 'user' ? 'Front' : 'Back');
                           let maxWidth = settings.width;
                           let maxHeight = settings.height;
                           let actual = {
                              label: cam + ' (' + maxWidth + 'x' + maxHeight + ')',
                              width: maxWidth,
                              height: maxHeight,
                              facingMode: settings.facingMode,
                              frameRate: 30,
                              deviceId: settings.deviceId,
                           }

                           onFound(actual)
                        }

                        // TODO if onFound throws, this is skipped
                        stream.getTracks().forEach((track: MediaStreamTrack) => {
                           track.stop();
                        });
                     })
                     .catch((err) => {
                        debug('getUserMedia.catch\n' + device.label + ':' + device.deviceId + '\n' + err);
                     });
                     */
               }
            }
         });
   }
}
