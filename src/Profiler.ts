/**
 * Utility class for logging timing messages for profile code
 */
export class Profiler {
   // the last time stamp
   private t = window.performance.now();

   public get elapsedMs() {
      return (window.performance.now() - this.t);
   }
   /**
    * Prints a message to console of the elapsed time since the last mark
    * 
    * @param msg The message to print with the time
    */
   public log(msg: string) {
      console.log(msg + ' ' + this.elapsedMs.toFixed(1) + ' ms');
      this.mark();
   }

   /**
    * Updates the timestamp to now
    */
   public mark() {
      this.t = window.performance.now();
   }

}