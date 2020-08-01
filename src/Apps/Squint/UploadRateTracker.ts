import { Stopwatch } from "../../Util/Stopwatch";
import { Averager } from "../../Util/Averager";

const MAX_FPS = 10;

/**
 * This class monitors the upload rate and recommends a frame rate to match. We
 * can then use this to pace our uploads to match available bandwidth.
 */
export class UploadRateTracker {

   private bufferFull = false;
   private uploadTimer: Stopwatch;
   private amountSent = 0;
   private bandwidthAverager = new Averager(5);
   private lastSize = 0;
   private uploadsWithoutBuffering = 0;

   /**
    * The number of ms that should occur between upload attempts
    */
   public get recommendedMsPerFrame(): number {
      // if we haven't computed a bandwidth yet, just go with 10 FPS
      if (this.bandwidthAverager.numSamples === 0) {
         return 1000 / MAX_FPS;
      }

      let lastSizeBits = 8 * this.lastSize;
      let bandwidthBitsPerMs = (1000 * 1000 * this.bandwidthAverager.average) / 1000;

      let calcMs = lastSizeBits / bandwidthBitsPerMs;

      // the actual rate, or a max FPS of 10
      return Math.max(1000 / MAX_FPS, calcMs);
   }

   public get recommendedFPS(): number {
      return 1000 / this.recommendedMsPerFrame;
   }

   /**
    * Upload bandwidth, Mbps
    */
   public get bandwidth(): number {
      if (this.bandwidthAverager.numSamples === 0) {
         return ((this.lastSize * 8) / (1000 * 1000)) * MAX_FPS;
      }
      else {
         return this.bandwidthAverager.average;
      }
   }

   /**
    * Call this when the buffer gets full
    */
   public onBufferFull() {
      this.bufferFull = true;
      this.uploadsWithoutBuffering = 0;
   }

   /**
    * Call this when the buffer empties and is ready again
    */
   public onReady() {

      // if we hit a situation where the buffer filled up, we know we have a situation
      // where we can accurately measure bandwidth
      if (this.bufferFull) {
         // first successful send since the buffer filled up. We can now measure bandwidth
         let bandwidth = 8 * (this.amountSent / this.uploadTimer.elapsedS) / (1000 * 1000);
         this.bandwidthAverager.push(bandwidth);

         // reset tracking of uploads
         this.amountSent = 0;
         this.uploadTimer = null;
         this.bufferFull = false;
      }
      else if (this.uploadsWithoutBuffering > 5 && this.recommendedFPS < MAX_FPS) {
         let average = this.bandwidthAverager.average;
         this.bandwidthAverager.clear();
         this.bandwidthAverager.push(2 * average);
      }
   }

   /**
    * Call this each time an upload is performed
    * 
    * @param amount The size of the upload in bytes
    */
   public onUpload(amount: number) {
      this.onReady();

      this.lastSize = amount;
      this.amountSent += amount;
      this.uploadsWithoutBuffering++;

      if (!this.uploadTimer) {
         this.uploadTimer = new Stopwatch();
      }
   }
}