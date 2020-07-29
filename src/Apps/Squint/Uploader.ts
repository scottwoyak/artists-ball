import { FPS } from "../../Util/FPS";
import { debug } from "./SquintApp";
import { SquintWS } from "./SquintWS";

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   private onDataNeeded: DataNeededHandler;
   public fps = new FPS();

   private running = true;
   private busy = false;
   private squint: SquintWS;

   public constructor(squint: SquintWS, onDataNeeded: DataNeededHandler) {
      console.log('starting uploader');
      this.squint = squint;
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
      if (!this.squint.bufferReady) {
         requestAnimationFrame(() => { this.upload() });
         return;
      }

      this.busy = true;

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

               this.fps.tick();
               this.squint.sendImage(blob);

               requestAnimationFrame(() => { this.upload() });

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