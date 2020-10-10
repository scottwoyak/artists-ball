import { toTimeStr } from './Globals';

/**
 * Utility class for tracking time
 */
export class Stopwatch {

   private accumulatedMs = 0;
   private startTime: number;
   private _paused = false;

   public get paused(): boolean {
      return this._paused;
   }

   public get running(): boolean {
      return !this.paused;
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
      if (isNaN(this.startTime)) {
         return this.accumulatedMs;
      }
      else {
         return this.accumulatedMs + (this.getTimeMs() - this.startTime);
      }
   }

   public set elapsedMs(value: number) {
      this.accumulatedMs = value;
      if (this.running) {
         this.startTime = this.getTimeMs();
      }
   }

   /**
    * The elapsed time in milliseconds
    */
   public get elapsedS(): number {
      return this.elapsedMs / 1000;
   }

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

   public constructor(start = true) {
      this.reset(start);
   }

   public reset(start: boolean): void {
      this.accumulatedMs = 0;
      if (start) {
         this._paused = false;
         this.startTime = this.getTimeMs();
      }
      else {
         this._paused = true;
         this.startTime = NaN;
      }
   }

   public restart(): void {
      this.reset(true);
   }

   public stop(): void {
      if (this._paused === false) {
         this._paused = true;
         this.accumulatedMs = this.elapsedMs;
         this.startTime = NaN;
      }
   }

   public start(): void {
      if (this._paused === true) {
         this._paused = false;
         this.startTime = this.getTimeMs();
      }
   }
}