import { Stopwatch } from './Stopwatch';

export interface ITimerInfo {
   durationMs: number,
   remainingMs: number,
   running: boolean,
}

const SEC = 1000;
const MIN = 60 * SEC;

export class CountdownTimer {
   private sw = new Stopwatch(false);
   public durationMs = 0;

   public get running(): boolean {
      return this.sw.paused === false && this.expired === false;
   }

   public get durationMin(): number {
      return this.durationMs / MIN;
   }

   public get remainingMs(): number {
      return Math.max(0, this.durationMs - this.sw.elapsedMs);
   }

   public get timeRemainingStr(): string {
      let remaining = this.remainingMs;
      let min = Math.floor(remaining / MIN);
      let sec = Math.floor((remaining - min * MIN) / SEC);
      let minStr = min < 10 ? '0' + min : min;
      let secStr = sec < 10 ? '0' + sec : sec;
      return minStr + ':' + secStr;
   }

   public get expired(): boolean {
      return (this.sw.elapsedMs > this.durationMs);
   }

   public get info(): ITimerInfo {
      return {
         running: this.running,
         durationMs: this.durationMs,
         remainingMs: this.remainingMs,
      }
   }

   public start(): void {
      if (this.sw.paused) {
         this.sw.start();
      }
   }

   public stop(): void {
      if (this.running) {
         this.sw.stop();
      }
   }

   public reset(): void {
      this.sw.reset(false);
   }

   public addOne(): void {
      this.stop();

      console.info('iiiiiiii addOne');
      this.durationMs = this.remainingMs;
      this.sw.elapsedMs = 0;

      // the next highest minute value
      this.durationMs = MIN * Math.floor(this.durationMin) + MIN;
   }

   public subtractOne(): void {
      this.stop();

      console.info('iiiiiiii subtractOne');
      this.durationMs = this.remainingMs;
      this.sw.elapsedMs = 0;

      // the next lowest minute value
      this.durationMs = MIN * Math.floor(0.9999 + this.durationMin) - MIN;
      this.durationMs = Math.max(this.durationMs, 0);
   }

   public synchronize(info: ITimerInfo): void {
      console.info('gggg ' + JSON.stringify(info));
      let durationMs = Math.max(0, info.durationMs);
      let remainingMs = Math.min(info.remainingMs, info.durationMs);
      remainingMs = Math.max(0, remainingMs);

      this.sw.reset(false);
      this.sw.elapsedMs = durationMs - remainingMs;
      this.durationMs = durationMs;

      if (durationMs >= 0 && remainingMs >= 0 && info.running) {
         this.sw.start();
      }
   }
}
