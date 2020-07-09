/**
 * Utility class for logging timing messages for profile code
 */
export class Profiler {

   private startTime = performance.now();

   /**
    * The elapsed time in milliseconds
    */
   public get elapsedMs() {
      return (performance.now() - this.startTime);
   }

   /**
    * Prints a message to console of the elapsed time
    * 
    * @param msg The message to print with the time
    */
   public log(msg: string) {
      console.log(msg + ' ' + this.elapsedMs.toFixed(1) + ' ms');
      this.startTime = performance.now();
   }
}