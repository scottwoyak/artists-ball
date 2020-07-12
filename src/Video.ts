import { debug } from "./SquintApp";

export interface IVideoResolution {
   label: string,
   width: number,
   height: number,
}

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

let testResolutions: IVideoResolution[] = [
   {
      label: 'Max',
      width: 10000,
      height: 10000,
   },
   {
      label: '4K (3840x2160)',
      width: 3840,
      height: 2160,
   },
   {
      label: '1440p (2560x1440)',
      width: 2560,
      height: 1440,
   },
   {
      label: 'HD (1920x1080)',
      width: 1920,
      height: 1080,
   },
   {
      label: 'HDx (1920x1080)',
      width: 1080,
      height: 1920,
   },
   {
      label: '720p (1280x720)',
      width: 1280,
      height: 720,
   },
   {
      label: '480p (854x480)',
      width: 854,
      height: 480,
   },
   {
      label: '2000x2000',
      width: 2000,
      height: 2000,
   },
   {
      label: '1000x1000',
      width: 1000,
      height: 1000,
   },
   {
      label: '500x500',
      width: 500,
      height: 500,
   },

];

export class Video {

   public static listResolutions(onFound: (resolution: IVideoResolution) => void) {

      let uniqueResolutions: IVideoResolution[] = [];

      if (!navigator.mediaDevices) {
         return Promise.reject('Host server must be https');
      }

      for (let i = 0; i < testResolutions.length; i++) {
         let desired = testResolutions[i];

         let video = document.createElement('video');

         video.onloadedmetadata = () => {
            let actual = new VideoResolution(desired,
               video.videoWidth,
               video.videoHeight);
            video.pause();
            video.srcObject = null;
            video.load();
            video = null;

            if (Video.isUnique(uniqueResolutions, actual)) {
               uniqueResolutions.push(actual);
               onFound(actual);
            }
         };

         const constraints = {
            video: desired,
         };

         // Attach the video stream to trigger the onloadedmetadata event
         navigator.mediaDevices.getUserMedia(constraints)
            .then((stream) => {
               video.srcObject = stream;
            })
            .catch((err) => {
               debug('getUserMedia.catch ' + err);
            });
      }
   }


   private static isUnique(array: IVideoResolution[], item: IVideoResolution) {
      for (let i = 0; i < array.length; i++) {
         if (array[i].width === item.width && array[i].height === item.height) {
            return false;
         }
      }

      return true;
   }
}
