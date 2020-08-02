import { Stopwatch } from "../../Util/Stopwatch";
import { Averager } from "../../Util/Averager";

const MAX_FPS = 10;

class Uploads {
   private _bytes = 0;
   private _numUploads = 0;
   private _lastUploadBytes = 0;

   public get numUploads(): number {
      return this._numUploads;
   }

   public get bytes(): number {
      return this._bytes;
   }

   public get lastUploadBytes(): number {
      return this._lastUploadBytes;
   }

   public reset() {
      this._bytes = 0;
      this._numUploads = 0;
   }

   public onUpload(bytes: number) {
      this._bytes += bytes;
      this._numUploads++;
      this._lastUploadBytes = bytes;
   }
}

/**
 * This class monitors the upload rate and recommends a frame rate to match. We
 * can then use this to pace our uploads to match available bandwidth.
 */
export class UploadRateTracker {

   private bufferFull = false;
   private uploadTimer: Stopwatch;
   private uploads = new Uploads();
   private bandwidthAverager = new Averager(20);
   private boostFps = false;

   /**
    * The number of ms that should occur between upload attempts
    */
   public get recommendedMsPerFrame(): number {
      // if we haven't computed a bandwidth yet, just go with 10 FPS
      if (this.bandwidthAverager.numSamples === 0) {
         return 1000 / MAX_FPS;
      }

      // convert bytes to bits to get Mbps
      let lastSizeBits = 8 * this.uploads.lastUploadBytes;
      let megaBitsPerMs = (1000 * 1000 * this.bandwidthAverager.average) / 1000;

      let calcMs = lastSizeBits / megaBitsPerMs;

      if (this.boostFps) {
         calcMs = 0.9 * calcMs;
      }

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
         return ((this.uploads.lastUploadBytes * 8) / (1000 * 1000)) * MAX_FPS;
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
      this.boostFps = false;
   }

   /**
    * Call this when the buffer empties and is ready again
    */
   public onReady() {

      // if we hit a situation where the buffer filled up, we know we have a situation
      // where we can accurately measure bandwidth
      if (this.bufferFull) {
         // first successful send since the buffer filled up. We can now measure bandwidth
         let bandwidth = 8 * (this.uploads.bytes / this.uploadTimer.elapsedS) / (1000 * 1000);
         this.bandwidthAverager.push(bandwidth);

         // reset tracking of uploads
         this.uploads.reset();
         this.uploadTimer = null;
         this.bufferFull = false;
      }
      else if (
         // conditions that must be met before increasing requested framerate
         this.uploads.numUploads > 5 &&
         this.uploads.bytes > 300 * 1000 &&
         this.recommendedFPS < MAX_FPS
      ) {
         // signal that we want a better rate
         this.boostFps = true;
      }
   }

   /**
    * Call this each time an upload is performed
    * 
    * @param amount The size of the upload in bytes
    */
   public onUpload(amount: number) {
      this.onReady();

      this.uploads.onUpload(amount);

      if (!this.uploadTimer) {
         this.uploadTimer = new Stopwatch();
      }
   }
}