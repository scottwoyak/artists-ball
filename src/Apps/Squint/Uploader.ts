import { debug } from './SquintApp';
import { Squint } from './Squint';
import { Stopwatch } from '../../Util/Stopwatch';
import { BandwidthTracker } from './BandwidthTracker';
import { SquintStrings } from './SquintStrings';

const MAX_FPS = 10;

export type TakePictureHandler = () => Promise<Blob>;

export class Uploader {
   private takePicture: TakePictureHandler;

   private running = true;
   private paused = false;
   private busy = false;
   private squint: Squint;
   private timer = new Stopwatch();
   private bandwidthTracker = new BandwidthTracker();
   private boostFps = false;
   private hadToWait = false;

   public get fps(): number {
      return this.bandwidthTracker.fps;
   }

   public get megaBitsPerSec(): number {
      return this.bandwidthTracker.megaBitsPerSec;
   }

   private get recommendedMsPerFrame(): number {
      // if we haven't computed a bandwidth yet, just go with 10 FPS
      if (this.bandwidthTracker.numSamples === 0) {
         return 1000 / MAX_FPS;
      }

      // convert bytes to bits to get Mbps
      const lastSizeBits = 8 * this.bandwidthTracker.lastTransferBytes;
      const bitsPerMs = (1000 * 1000) * this.bandwidthTracker.megaBitsPerSec / 1000;

      let calcMs = lastSizeBits / bitsPerMs;

      if (this.boostFps) {
         calcMs = 0.5 * calcMs;
      }
      calcMs = Math.min(calcMs, 300);

      // the actual rate, or a max FPS of 10
      return Math.max(1000 / MAX_FPS, calcMs);

   }

   public constructor(squint: Squint, takePicture: TakePictureHandler) {
      this.squint = squint;
      this.takePicture = takePicture;

      this.upload();
   }

   public stop(): void {
      if (this.running) {
         this.running = false;
      }
   }

   public pause(): void {
      this.paused = true;
      this.bandwidthTracker.pause();
   }

   public resume(): void {
      this.paused = false;
      this.bandwidthTracker.resume();
      this.upload();
   }

   private upload(delay = 0) {

      if (!this.running) {
         // this can happen for a number of reasons, e.g. while we were waiting for the
         // next animation frame the socket was closed.
         //debug('upload() this.running===false, returning');
         return;
      }
      if (this.paused) {
         return;
      }
      if (this.busy) {
         debug('upload() called before previous call returned');
         //requestAnimationFrame(() => { this.upload(1000) });
         return;
      }
      if (delay > 0) {
         setTimeout(() => {
            this.upload(0);
         }, delay);
         return;
      }
      if (this.squint.connected === false) {
         this.upload(1000);
         return;
      }
      if (this.timer.elapsedMs < this.recommendedMsPerFrame) {
         this.upload(this.recommendedMsPerFrame - this.timer.elapsedMs);
         return;
      }
      else {
         this.timer.restart();
      }

      // if this is the first time we get here and buffer is ready, boost.
      if (this.hadToWait === false && this.squint.bufferReady) {
         this.boostFps = true;
      }

      if (!this.squint.bufferReady) {
         this.hadToWait = true;
         requestAnimationFrame(() => { this.upload() });
         return;
      }

      this.hadToWait = false;
      this.busy = true;

      try {
         let nextDelay = 0;
         this.takePicture()
            .then((blob: Blob) => {

               if (blob === null) {
                  nextDelay = 1000;
                  debug('takePicture generated a null Blob');
               }
               else {
                  if (this.squint.connected) {
                     this.squint.sendImage(blob);
                     this.bandwidthTracker.tick(blob.size);
                  }
               }

            }).catch((err) => {
               if (err === SquintStrings.CAMERA_NOT_READY) {
                  // this happens when the camera is being initialized. Just try
                  // again in a second
               }
               else {
                  debug('Cannot generate image from video: ' + err);
               }
               nextDelay = 1000;
            })
            .finally(() => {
               this.busy = false;
               requestAnimationFrame(() => { this.upload(nextDelay) });
            });
      }
      catch (err) {
         console.error('Unexpected exception in Uploader.upload(): ' + err + '\n' + JSON.stringify(err, null, ' '));
         this.busy = false;
         requestAnimationFrame(() => { this.upload(1000) });
      }
   }
}