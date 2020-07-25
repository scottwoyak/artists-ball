/**
 * Utility class for tracking time
 */
export class Stopwatch {

   private startTime = performance.now();

   /**
    * The elapsed time in milliseconds
    */
   public get elapsedMs() {
      return (performance.now() - this.startTime);
   }

   /**
    * Resets elapsed time to 0
    */
   public restart() {
      this.startTime = performance.now();
   }
}