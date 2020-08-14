import { Stopwatch } from "../../Util/Stopwatch";

class Transfer {
   public bytes: number;
   public stopwatch: Stopwatch;
}

/**
 * This class monitors the upload rate and recommends a frame rate to match. We
 * can then use this to pace our uploads to match available bandwidth.
 */
export class BandwidthTracker {

   private transfers: Transfer[] = [];

   public get numSamples(): number {
      return this.transfers.length;
   }

   public get lastTransferBytes(): number {
      let numSamples = this.transfers.length;
      return this.transfers[numSamples - 1].bytes;
   }

   /**
    * bandwidth, Mbps
    */
   public get megaBitsPerSec(): number {
      if (this.transfers.length === 0) {
         return Number.NaN;
      }
      else {
         // sum the bytes
         let total = 0;
         for (let transfer of this.transfers) {
            total += transfer.bytes;
         }

         return (8 * total / (1000 * 1000)) / this.transfers[0].stopwatch.elapsedS;
      }
   }

   /**
    * Call this data is transfered
    */
   public onTransfer(bytes: number) {
      this.transfers.push({ bytes: bytes, stopwatch: new Stopwatch() });
      while (
         this.transfers.length > 20 ||
         (this.transfers.length > 2 && (this.transfers[0].stopwatch.elapsedS > 3))
      ) {
         this.transfers.shift();
      }
   }
}