import { debug } from "./SquintApp";

export interface IVideoResolution {
   label: string,
   width: number,
   height: number,
   frameRate: number,
   deviceId: string,
   facingMode: string,
}

/*
class VideoResolution {
   public label: string;
   public width: number;
   public height: number;

   public constructor(desired: IVideoResolution,
      actualWidth: number,
      actualHeight: number) {
      this.width = actualWidth;
      this.height = actualHeight;

      if (desired.width === actualWidth && desired.height === actualHeight) {
         this.label = desired.label;
      }
      else {
         this.label = actualWidth + 'x' + actualHeight;
      }
   }
}
*/

export class Video {

   public static getResolutions(onFound: (resolution: IVideoResolution) => void) {
      navigator.mediaDevices.enumerateDevices()
         .then((devices) => {
            for (let i = 0; i < devices.length; i++) {
               let device = devices[i];
               if (device.kind === 'videoinput') {
                  //alert(i + ': \n' + JSON.stringify(device.toJSON(), null, ' '));
               }

               if (device.kind === 'videoinput') {
                  const constraints = {
                     video:
                     {
                        /*
                        width: 10 * 1024,
                        height: 10 * 1024,
                        frameRate: 30,
                        */
                        deviceId: device.deviceId,
                     }
                  };

                  navigator.mediaDevices.getUserMedia(constraints)
                     .then((stream) => {
                        let mediaTrack = stream.getVideoTracks()[0];
                        let capabilities = mediaTrack.getCapabilities(); // not supported by firefox
                        //alert(JSON.stringify(capabilities));
                        let constraints = mediaTrack.getConstraints();
                        let settings = mediaTrack.getSettings();

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
                     })
                     .catch((err) => {
                        debug('getUserMedia.catch ' + err);
                     });

               }
            }
         });
   }
}
