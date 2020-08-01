import { toTimeStr } from "./Globals";

/**
 * Utility class for tracking time
 */
export class Stopwatch {

   private startTime = performance.now();

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
      return (performance.now() - this.startTime);
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
   public restart() {
      this.startTime = performance.now();
   }
}