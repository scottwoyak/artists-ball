export class FPS {
   private ticks: number[] = [];

   public constructor() {
   }

   private get spanMs(): number {
      if (this.ticks.length < 2) {
         return 0;
      }
      else {
         return (this.ticks[this.ticks.length - 1] - this.ticks[0]);
      }
   }

   public get ms(): number {
      if (this.ticks.length < 2) {
         return 0;
      }
      else {
         return this.spanMs / this.ticks.length;
      }
   }

   public get rate(): number {
      if (this.ticks.length < 2) {
         return 0;
      }
      else {
         return 1000 / this.ms;
      }
   }

   public tick() {

      this.ticks.push(window.performance.now());

      // trim off the size as long as there are at least 20 entries and the
      // time span between all entries is at least 1 second
      while (this.ticks.length > 20 && this.spanMs > 2000) {
         this.ticks.shift();
      }
   }
}