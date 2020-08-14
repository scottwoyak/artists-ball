import { FPS } from "../../Util/FPS";
import { debug, SquintStrings } from "./SquintApp";
import { Squint } from "./Squint";
import { Stopwatch } from "../../Util/Stopwatch";
import { BandwidthTracker } from "./BandwidthTracker";

const MAX_FPS = 10;

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   private onDataNeeded: DataNeededHandler;

   private running = true;
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
      let lastSizeBits = 8 * this.bandwidthTracker.lastTransferBytes;
      let bitsPerMs = (1000 * 1000) * this.bandwidthTracker.megaBitsPerSec / 1000;

      let calcMs = lastSizeBits / bitsPerMs;

      if (this.boostFps) {
         calcMs = 0.5 * calcMs;
      }
      calcMs = Math.min(calcMs, 300);

      // the actual rate, or a max FPS of 10
      return Math.max(1000 / MAX_FPS, calcMs);

   }

   public constructor(squint: Squint, onDataNeeded: DataNeededHandler) {
      this.squint = squint;
      this.onDataNeeded = onDataNeeded;

      this.upload();
   }

   public stop() {
      if (this.running) {
         this.running = false;
      }
   }

   private upload(delay = 0) {

      if (!this.running) {
         // this can happen for a number of reasons, e.g. while we were waiting for the
         // next animation frame the socket was closed.
         //debug('upload() this.running===false, returning');
         return;
      }
      if (this.busy) {
         debug('upload() called before previous call returned');
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
         this.onDataNeeded()
            .then((blob: Blob) => {

               if (this.squint.connected) {
                  this.squint.sendImage(blob);
                  this.bandwidthTracker.onTransfer(blob.size);
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
         console.error('Unexpected exception in Uploader.onDataNeeded(): ' + err);
         this.stop();
      }
   }
}