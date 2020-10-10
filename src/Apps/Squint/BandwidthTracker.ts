import { FPS } from '../../Util/FPS';
import { Stopwatch } from '../../Util/Stopwatch';

class Transfer {
   public bytes: number;
   public elapsedS = NaN;

   public constructor(bytes: number) {
      this.bytes = bytes;
   }

   public end(elapsedS: number) {
      this.elapsedS = elapsedS;
   }
}

/**
 * This class monitors the upload rate and recommends a frame rate to match. We
 * can then use this to pace our uploads to match available bandwidth.
 */
export class BandwidthTracker {

   private transfers: Transfer[] = [];
   private _fps = new FPS();
   private stopwatch: Stopwatch = new Stopwatch();
   private activeTransfer: Transfer | null = null;

   public get numSamples(): number {
      return this.transfers.length;
   }

   public get lastTransferBytes(): number {
      if (this.activeTransfer !== null) {
         return this.activeTransfer.bytes;
      }
      else {
         return NaN;
      }
   }

   private get elapsedS(): number {
      let elapsedS = 0;
      for (const transfer of this.transfers) {
         elapsedS += transfer.elapsedS;
      }
      return elapsedS;
   }

   private get bytes(): number {
      let bytes = 0;
      for (const transfer of this.transfers) {
         bytes += transfer.bytes;
      }
      return bytes
   }

   /**
    * bandwidth, Mbps
    */
   public get megaBitsPerSec(): number {
      if (this.transfers.length < 2) {
         return Number.NaN;
      }
      else {
         return (8 * this.bytes / (1000 * 1000)) / this.elapsedS;
      }
   }

   public get fps(): number {
      return this._fps.rate;
   }

   public pause(): void {
      this.stopwatch.stop();
   }

   public resume(): void {
      this.stopwatch.start();
   }

   /**
    * Call this data is transfered
    */
   public tick(bytes: number): void {

      // create an object for tracking the transfer
      const transfer = new Transfer(bytes);

      // capture the transfer
      if (this.activeTransfer !== null) {
         this.activeTransfer.end(this.stopwatch.elapsedS);
         this.transfers.push(this.activeTransfer);
      }

      this.activeTransfer = transfer;

      // start a new transfer
      this.activeTransfer = new Transfer(bytes);
      this.stopwatch.restart();
      this._fps.tick();

      // trim existing transfers
      while (
         this.transfers.length > 20 ||
         (this.transfers.length > 2 && (this.elapsedS > 3))
      ) {
         this.transfers.shift();
      }
   }
}