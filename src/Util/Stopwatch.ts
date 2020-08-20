import { toTimeStr } from './Globals';

/**
 * Utility class for tracking time
 */
export class Stopwatch {

   private accumulatedMs = 0;
   private startTime = performance.now();
   private _paused = false;

   public get paused(): boolean {
      return this._paused;
   }

   public pause(): void {
      if (this._paused === false) {
         this._paused = true;
         this.accumulatedMs = this.elapsedMs;
         this.startTime = NaN;
      }
   }

   public resume(): void {
      if (this._paused === true) {
         this._paused = false;
         this.startTime = performance.now();
      }
   }

   /**
    * The elapsed time in as a string
    */
   public get elapsedStr(): string {
      return toTimeStr(this.elapsedMs);
   }

   /**
    * The elapsed time in milliseconds
    */
   public get elapsedMs(): number {
      return this.accumulatedMs + (performance.now() - this.startTime);
   }

   /**
    * The elapsed time in milliseconds
    */
   public get elapsedS(): number {
      return this.elapsedMs / 1000;
   }

   /**
    * Resets elapsed time to 0
    */
   public restart(): void {
      this.startTime = performance.now();
      this.accumulatedMs = 0;
      this._paused = false;
   }
}