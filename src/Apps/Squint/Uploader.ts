import { FPS } from "../../Util/FPS";
import { debug, SquintStrings } from "./SquintApp";
import { Squint } from "./Squint";
import { Stopwatch } from "../../Util/Stopwatch";

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   private onDataNeeded: DataNeededHandler;
   public fps = new FPS();

   private running = true;
   private busy = false;
   private squint: Squint;
   private timer = new Stopwatch();

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

   private i = 0;
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
      if (this.timer.elapsedMs < 100) {
         this.upload(100 - this.timer.elapsedMs);
         return;
      }
      else {
         this.timer.restart();
      }

      if (!this.squint.bufferReady) {
         console.log(this.i++ + ' buffer full');
         requestAnimationFrame(() => { this.upload() });
         return;
      }

      this.busy = true;

      try {
         this.onDataNeeded()
            .then((blob: Blob) => {

               this.squint.sendImage(blob);
               this.fps.tick();

               requestAnimationFrame(() => { this.upload() });

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