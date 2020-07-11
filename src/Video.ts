
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

   public static getResolutions(): Promise<IVideoResolution[]> {

      // TODO test that navigator.mediaDevices exists
      let promises: Promise<IVideoResolution>[] = [];

      testResolutions.forEach((desired: IVideoResolution) => {

         let promise = new Promise<IVideoResolution>((resolve) => {
            let video = document.createElement('video');

            video.onloadedmetadata = () => {
               let actual = new VideoResolution(desired,
                  video.videoWidth,
                  video.videoHeight);
               video.pause();
               video.srcObject = null;
               video.load();
               video = null;

               resolve(actual);
            };

            const constraints = {
               video: desired,
            };

            // Attach the video stream to trigger the onloadedmetadata event
            navigator.mediaDevices.getUserMedia(constraints)
               .then((stream) => {
                  video.srcObject = stream;
               })
         });
         promises.push(promise);
      });

      return Promise.all(promises)
         .then((resolutions) => {
            let uniqueResolutions: IVideoResolution[] = [];

            resolutions.forEach((resolution) => {
               // TODO sort
               if (Video.isUnique(uniqueResolutions, resolution)) {
                  uniqueResolutions.push(resolution);
               }
            });
            return uniqueResolutions;
         });
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
