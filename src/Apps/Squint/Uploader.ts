import { FPS } from "../../Util/FPS";
import { debug, SquintStrings } from "./SquintApp";
import { Squint } from "./Squint";
import { Stopwatch } from "../../Util/Stopwatch";
import { UploadRateTracker } from "./UploadRateTracker";

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   private onDataNeeded: DataNeededHandler;
   private fpsTracker = new FPS();

   private running = true;
   private busy = false;
   private squint: Squint;
   private timer = new Stopwatch();
   private uploadTracker = new UploadRateTracker();

   public get fps(): number {
      return this.fpsTracker.rate;
   }

   public get bandwidth(): number {
      return this.uploadTracker.bandwidth;
   }

   public constructor(squint: Squint, onDataNeeded: DataNeededHandler) {
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
         return;
      }
      if (delay > 0) {
         setTimeout(() => {
            this.upload(0);
         }, delay);
         return;
      }
      if (this.squint.connected === false) {
         this.stop();
         return;
      }
      if (this.timer.elapsedMs < this.uploadTracker.recommendedMsPerFrame) {
         this.upload(this.uploadTracker.recommendedMsPerFrame - this.timer.elapsedMs);
         return;
      }
      else {
         this.timer.restart();
      }

      if (!this.squint.bufferReady) {
         this.uploadTracker.onBufferFull();
         requestAnimationFrame(() => { this.upload() });
         return;
      }

      this.uploadTracker.onReady();
      this.busy = true;

      try {
         this.onDataNeeded()
            .then((blob: Blob) => {

               if (this.squint.connected) {
                  this.squint.sendImage(blob);
                  this.uploadTracker.onUpload(blob.size);
                  this.fpsTracker.tick();

                  requestAnimationFrame(() => { this.upload() });
               }
            }).catch((err) => {
               if (err === SquintStrings.CAMERA_NOT_READY) {
                  // this happens when the camera is being initialized. Just try
                  // again in a second
                  this.busy = false;
                  this.upload(1000);
                  return;
               }
               else {
                  debug('Cannot generate image from video: ' + err);
               }
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