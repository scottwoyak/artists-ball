import { FPS } from "../../Util/FPS";
import { Squint, SquintError } from "./Squint";
import { debug } from "./SquintApp";
import { Stopwatch } from "../../Util/Stopwatch";
import { toSizeStr, toTimeStr } from "../../Util/Globals";

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   private onDataNeeded: DataNeededHandler;
   public uploadTime: number;
   public fps = new FPS();

   private running = true;
   private busy = false;
   private squint: Squint;
   private id: string;

   public constructor(squint: Squint, id: string, onDataNeeded: DataNeededHandler) {
      console.log('starting uploader');
      this.squint = squint;
      this.id = id;
      this.onDataNeeded = onDataNeeded;

      this.upload();
   }

   public stop() {
      if (this.running) {
         console.log('stopping uploader');
         this.running = false;
      }
   }

   private upload(delay = 0) {

      if (!this.running) {
         return;
      }
      if (this.busy) {
         console.error('upload() called before previous call returned');
      }
      if (delay > 0) {
         setTimeout(() => {
            this.upload(0);
         }, delay);
         return;
      }

      this.busy = false;
      this.fps.tick();

      try {
         this.onDataNeeded()
            .then((blob: Blob) => {
               if (blob === null) {
                  // this happens when the camera is being initialized. Just try
                  // again in a second
                  console.warn('Cannot generate image from video: blob is null. Trying again');
                  this.upload(1000);
                  this.busy = false;
                  return;
               }

               let url = URL.createObjectURL(blob);
               let fd = new FormData();
               fd.append('image', blob);

               let sw = new Stopwatch();
               console.log('starting upload: size=' + toSizeStr(blob.size));

               return this.squint.put(this.id, fd)
                  .then(() => {
                     console.log('uploaded: ' + toTimeStr(sw.elapsedMs));
                     this.uploadTime = sw.elapsedMs;
                     this.upload();
                  })
                  .catch((err) => {
                     // TODO fix error message to match the full url
                     if (err.name === 'AbortError') {
                        this.stop();
                     }
                     else if (err instanceof SquintError) {
                        console.log('upload failed (stopping uploads): ' + err);
                        // TODO figure out when we should retry
                        this.stop();
                     }
                     else {
                        console.log('upload failed (trying again): ' + err);
                        this.upload(3000);
                     }
                  })
                  .finally(() => {
                     URL.revokeObjectURL(url);
                  });
            }).catch((err) => {
               debug('Cannot generate image from video: ' + err);
            })
            .finally(() => {
               this.busy = false;
            });
      }
      catch (err) {
         console.error('Unexpected exception in Uploader.onDataNeeded(): ' + err);
         this.stop();
      }
   }
}