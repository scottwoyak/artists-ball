import { Stopwatch } from '../../Util/Stopwatch';
import { ITimerInfo } from './SquintMessage';

const SEC = 1000;
const MIN = 60 * SEC;

export class CountdownTimer {
   private sw: Stopwatch = new Stopwatch(false);
   public durationMs: number;

   public get running(): boolean {
      return this.sw.paused === false;
   }

   public get durationMin(): number {
      return this.durationMs / MIN;
   }

   public get elapsedMs(): number {
      return this.sw.elapsedMs;
   }

   public get remainingMs(): number {
      return Math.max(0, this.durationMs - this.sw.elapsedMs);
   }

   /*
   public get timeRemainingMin(): number {
      return Math.max(0, this.durationMs - this.sw.elapsedMs) / MIN;
   }
*/

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

   public start(): void {
      if (this.sw.paused) {
         this.sw.resume();
      }
   }

   public pause(): void {
      if (this.running) {
         this.sw.pause();
      }
   }

   public reset(): void {
      this.sw.reset(false);
   }

   public addOne(): void {
      this.pause();

      this.durationMs = this.remainingMs;
      this.sw.elapsedMs = 0;

      // the next highest minute value
      this.durationMs = MIN * Math.floor(this.durationMin) + MIN;
   }

   public subtractOne(): void {
      this.pause();

      this.durationMs = this.remainingMs;
      this.sw.elapsedMs = 0;

      // the next lowest minute value
      this.durationMs = MIN * Math.floor(0.9999 + this.durationMin) - MIN;
      this.durationMs = Math.max(this.durationMs, 0);
   }

   public synchronize(info: ITimerInfo): void {
      if (this.running !== info.running) {
         this.sw.reset(info.running);
      }
      this.sw.elapsedMs = info.elapsedMs;
      this.durationMs = info.durationMs;
   }
}
