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
      label: '720p (1280x720)',
      width: 1280,
      height: 720,
   },
   {
      label: '480p (854x480)',
      width: 854,
      height: 480,
   },
];

export class Video {

   public static listResolutions(onFound: (resolution: IVideoResolution) => void) {

      try {
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
      catch (err) {
         debug('getResolution exception: ' + err);
         alert('getResolutions exception: ' + err);
         return null;
      }
   }


   public static getResolutions(): Promise<IVideoResolution[]> {

      debug('getting resolutions');
      try {
         if (!navigator.mediaDevices) {
            debug('rejecting - no media devices');
            return Promise.reject('Host server must be https');
         }

         let promises: Promise<IVideoResolution>[] = [];

         for (let i = 0; i < testResolutions.length; i++) {
            let desired = testResolutions[i];

            let promise = new Promise<IVideoResolution>((resolve, reject) => {
               debug('creating video element ' + 1);
               let video = document.createElement('video');
               debug('created ' + 1);

               video.onloadedmetadata = () => {
                  debug('onloadmetadata ' + i);
                  let actual = new VideoResolution(desired,
                     video.videoWidth,
                     video.videoHeight);
                  video.pause();
                  video.srcObject = null;
                  video.load();
                  video = null;
                  debug('video cleared ' + i + ' ' + actual.label);

                  resolve(actual);
               };

               const constraints = {
                  video: desired,
               };

               debug('getUserMedia ' + i);
               // Attach the video stream to trigger the onloadedmetadata event
               navigator.mediaDevices.getUserMedia(constraints)
                  .then((stream) => {
                     debug('getUserMedia.then ' + i);
                     video.srcObject = stream;
                     debug('video.srcObject set ' + i);
                  })
                  .catch((err) => {
                     debug('getUserMedia.catch ' + err);
                     reject(err);
                  });
            });
            promises.push(promise);
         }

         debug('returning promise.all');

         return Promise.all(promises)
            .then((resolutions) => {
               debug('promise.all.then');
               let uniqueResolutions: IVideoResolution[] = [];

               resolutions.forEach((resolution) => {
                  // TODO sort
                  if (Video.isUnique(uniqueResolutions, resolution)) {
                     debug('supported: ' + resolution.label);
                     uniqueResolutions.push(resolution);
                  }
               });
               return uniqueResolutions;
            })
            .catch((err) => {
               debug('promise.all.catch ' + err);
               return [];
            });
      }
      catch (err) {
         debug('getResolution exception: ' + err);
         alert('getResolutions exception: ' + err);
         return null;
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
