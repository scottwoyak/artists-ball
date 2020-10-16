import { CountdownTimer, ITimerInfo } from '../../Util/CountdownTimer';
import { Squint } from './Squint';
import { SquintEvent } from './SquintEvents';

enum TimeMs {
   Sec = 1000,
   Min = 60 * Sec,
   StdPose = 20 * Min,
   StdBreak = 7 * Min,
}

export type OnTickHandler = (info: ITimerInfo) => void;
export type OnAlarmHandler = (sound: boolean) => void;

export class ModelTimer {
   private squint: Squint;
   private countdownTimer = new CountdownTimer();

   public alarmDurationMs = 15 * TimeMs.Sec;

   private alarmTimeoutHandle = NaN;
   private tickTimeoutHandle = NaN;

   public onTick: OnTickHandler = null;
   public onAlarm: OnAlarmHandler = null;


   public get running(): boolean {
      return this.countdownTimer.running;
   }

   /**
    * This value is only for testing
    */
   public get ticking(): boolean {
      return !isNaN(this.tickTimeoutHandle);
   }

   public get durationMs(): number {
      return this.countdownTimer.durationMs;
   }

   public set durationMs(value: number) {
      console.info('aaa setting duration: ' + value);
      this.countdownTimer.durationMs = value;
      this.tick();
      this.synchronizeToServer();
   }

   public get remainingMs(): number {
      return this.countdownTimer.remainingMs;
   }

   public get timeRemainingStr(): string {
      return this.countdownTimer.timeRemainingStr;
   }

   public get alarmSounding(): boolean {
      return !isNaN(this.alarmTimeoutHandle);
   }

   public get info(): ITimerInfo {
      return this.countdownTimer.info;
   }

   public constructor(squint: Squint) {
      this.squint = squint;
      this.countdownTimer.durationMs = TimeMs.StdPose;

      squint.on({
         event: SquintEvent.SynchronizeTimer,
         handler: (info: ITimerInfo) => {

            console.info('from server: ' + JSON.stringify(info))
            this.countdownTimer.synchronize(info);
            this.tick();
            /*
            // stop the alarm on any signal from another connection
            if (!isNaN(this.alarmTimeoutHandle)) {
               window.clearTimeout(this.alarmTimeoutHandle);
               this.alarmTimeoutHandle = NaN;
            }

            this.countdownTimer.synchronize(info);

            // start/stop/change ticking if needed
            this.resetTicking();
            */
         }
      })
   }

   /*
   private resetTicking(): void {
      if (!isNaN(this.tickTimeoutHandle)) {
         // remove the old timer
         window.clearTimeout(this.tickTimeoutHandle);
         this.tickTimeoutHandle = NaN;

         // if running, add the new timer
         if (this.countdownTimer.running) {
            this.registerNextTick();
         }
      }
      else {
         // if the timer has newly started, trigger a tick
         if (this.countdownTimer.running) {
            this.tick();
         }
      }
   }
   */

   private synchronizeToServer(): void {
      console.info('to server: ' + JSON.stringify(this.countdownTimer.info))
      this.squint.synchronizeTimer(this.countdownTimer.info);
   }

   public synchronizeFromServer(): void {
      console.info('requesting from server');
      this.squint.synchronizeTimer();
   }

   private tick(): void {
      if (this.onTick) {
         this.onTick(this.countdownTimer.info);
      }

      if (this.countdownTimer.expired && !this.alarmSounding) {

         this.alarmTimeoutHandle = window.setTimeout(() => {
            this.countdownTimer.reset();
            this.alarmTimeoutHandle = NaN;
            if (this.onAlarm) {
               this.onAlarm(false);
            }
         }, this.alarmDurationMs);

         // do this after setting a timeout value so that alarmSounding = true
         if (this.onAlarm) {
            this.onAlarm(true);
         }
      }

      if (this.ticking) {
         window.clearTimeout(this.tickTimeoutHandle);
         this.tickTimeoutHandle = NaN;
      }

      // if the timer is running request the next timeout
      if (this.countdownTimer.running) {
         this.registerNextTick();
      }
   }

   private registerNextTick(): void {
      this.tickTimeoutHandle = window.setTimeout(() => {
         this.tickTimeoutHandle = NaN;
         this.tick();
      }, this.countdownTimer.info.remainingMs % 1000 + 1);
   }

   public start(): void {
      if (this.countdownTimer.running === false) {
         console.info('duration: ' + this.countdownTimer.durationMs);
         this.countdownTimer.start();
         this.squint.synchronizeTimer({
            running: true,
            durationMs: this.countdownTimer.info.durationMs,
            remainingMs: this.countdownTimer.info.remainingMs
         });
         console.info('xxx ' + JSON.stringify(this.countdownTimer.info));
         this.tick();
         console.info('xxx ' + JSON.stringify(this.countdownTimer.info));
         console.info('running: ' + this.running);
      }
   }

   public stop(): void {
      if (this.countdownTimer.running) {
         this.countdownTimer.stop();
         this.synchronizeToServer();
      }

      if (this.ticking) {
         window.clearTimeout(this.tickTimeoutHandle);
         this.tickTimeoutHandle = NaN;
      }
   }

   public reset(): void {
      this.countdownTimer.reset();
      if (this.durationMs === TimeMs.StdBreak) {
         // prepare for next pose;
         this.durationMs = TimeMs.StdPose;
      }
      else if (this.durationMs === TimeMs.StdPose) {
         // prepare for the break
         this.durationMs = TimeMs.StdBreak;
      }
   }

   public stopAlarm(): void {
      if (this.alarmSounding) {
         window.clearTimeout(this.alarmTimeoutHandle);
         this.alarmTimeoutHandle = NaN;

         this.synchronizeToServer();

         if (this.onAlarm) {
            this.onAlarm(false);
         }
      }
   }

   public addOne(): void {
      this.countdownTimer.addOne();
      this.synchronizeToServer();
   }

   public subtractOne(): void {
      this.countdownTimer.subtractOne();
      this.synchronizeToServer();
   }

}