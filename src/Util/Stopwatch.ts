import { toTimeStr } from './Globals';

/**
 * Utility class for tracking time
 */
export class Stopwatch {

   private accumulatedMs = 0;
   private startTime: number;
   private _paused = false;

   private getTimeMs(): number {
      // window.performance is not defined for nodejs so our test need
      // this to compile
      if (window.performance !== undefined) {
         return window.performance.now();
      }
      else {
         return Date.now();
      }
   }

   public constructor() {
      this.startTime = this.getTimeMs();
   }

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
         this.startTime = this.getTimeMs();
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
      return this.accumulatedMs + (this.getTimeMs() - this.startTime);
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
      this.startTime = this.getTimeMs();
      this.accumulatedMs = 0;
      this._paused = false;
   }
}