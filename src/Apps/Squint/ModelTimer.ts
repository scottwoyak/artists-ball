import { GUI } from '../../GUI/GUI';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { getEmPixels } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { CountdownTimer } from './CountdownTimer';
import { Squint } from './Squint';
import { SquintApp } from './SquintApp';
import { SquintEvent } from './SquintEvents';
import { ITimerInfo } from './SquintMessage';

enum TimeMs {
   Sec = 1000,
   Min = 60 * Sec,
   StdPose = 20 * Min,
   StdBreak = 7 * Min,
}

export class ModelTimer {
   private squint: Squint;
   private canvas: HTMLCanvasElement;
   private countdownTimer = new CountdownTimer;
   private alarm = new Audio(SquintApp.baseUrl + 'sounds/timer.mp3');
   private notification = new Audio(SquintApp.baseUrl + '/sounds/notification.mp3');

   private get info(): ITimerInfo {
      return {
         running: this.countdownTimer.running,
         durationMs: this.countdownTimer.durationMs,
         elapsedMs: this.countdownTimer.elapsedMs,
      }
   }

   public constructor(squint: Squint, parent: HTMLElement) {
      this.squint = squint;
      this.canvas = GUI.create('canvas', 'ModelTimerCanvas', parent);
      this.countdownTimer.durationMs = TimeMs.StdPose;
      this.alarm.loop = true;

      squint.on({
         event: SquintEvent.SynchronizeTimer,
         handler: (info: ITimerInfo) => {

            if (this.countdownTimer.running && this.countdownTimer.expired) {
               this.alarm.pause();
               this.alarm.currentTime = 0;
            }
            else if (this.countdownTimer.running === false && info.running) {
               this.playNotification();
            }

            this.countdownTimer.synchronize(info);
         }
      })

      let handler = new PointerEventHandler(this.canvas);

      handler.onMove = (pos: Vec2, delta: Vec2) => {
         this.stopAlarm();
         let boxSize = this.canvas.clientHeight;
         if (pos.x < 0.5 * boxSize) {
            this.canvas.style.cursor = 'ns-resize';
         }
         else {
            this.canvas.style.cursor = 'default';
         }
      }

      let wasDragging = false;
      handler.onUp = (pos: Vec2) => {
         document.body.style.cursor = 'default';
         let height = this.canvas.clientHeight;
         let width = this.canvas.clientWidth;
         let boxSize = height;
         if (wasDragging === false && pos.x < 0.5 * boxSize) {
            if (pos.y < 0.5 * height) {
               this.countdownTimer.addOne();
            }
            else {
               this.countdownTimer.subtractOne();
            }

            this.squint.synchronizeTimer(this.info);
            this.draw();
         }
         else if (wasDragging) {
            this.squint.synchronizeTimer(this.info);
         }
         else if (pos.x > width - boxSize) {
            if (this.countdownTimer.running) {
               this.playNotification();
               this.countdownTimer.pause();
            }
            else {
               this.playNotification();
               this.countdownTimer.start();
            }
            this.squint.synchronizeTimer(this.info);
         }

         wasDragging = false;
      }

      let hit = false;
      let accumulatedDelta = 0;
      handler.onDown = (pos: Vec2) => {
         this.stopAlarm();
         let boxSize = this.canvas.clientHeight;
         hit = false;
         if (pos.x < 0.5 * boxSize) {
            hit = true;
         }
      }

      let step = getEmPixels() / 2;
      handler.onDrag = (pos: Vec2, delta: Vec2) => {
         if (hit === true) {
            document.body.style.cursor = 'ns-resize';
            accumulatedDelta += delta.y;
            while (accumulatedDelta > step) {
               wasDragging = true;
               this.countdownTimer.subtractOne();
               accumulatedDelta -= step;
            }
            while (accumulatedDelta < -step) {
               wasDragging = true;
               this.countdownTimer.addOne();
               accumulatedDelta += step;
            }

            this.draw();
         }

      }

      document.body.addEventListener('mousedown', () => { this.stopAlarm(); });
      document.body.addEventListener('touchstart', () => { this.stopAlarm(); });

      this.requestTimeout();
   }

   private setCanvasSize(): void {
      let em = getEmPixels();
      let height = this.canvas.clientHeight;
      let largeFont = (height - 0.5 * em);

      let ctx = this.canvas.getContext('2d');
      ctx.font = largeFont + 'px Arial';
      let size = ctx.measureText(' 00:00 ');

      let width = 0.5 * height + size.width + 1.0 * height;
      this.canvas.style.width = width + 'px';
   }

   private playNotification() {
      //this.notification.play().catch((err) => { alert('Cannot play notification: ' + err) });
   }

   private soundAlarm() {
      this.alarm.play().catch((err) => { alert('Cannot play alarm: ' + err) });
   }

   private stopAlarm() {
      if (this.countdownTimer.running && this.countdownTimer.expired) {
         this.alarm.pause();
         this.alarm.currentTime = 0;

         this.countdownTimer.reset();
         if (this.countdownTimer.durationMin === TimeMs.StdBreak) {
            // prepare for next pose;
            this.countdownTimer.durationMs = TimeMs.StdPose;
         }
         else if (this.countdownTimer.durationMs === TimeMs.StdPose) {
            // prepare for the break
            this.countdownTimer.durationMs = TimeMs.StdBreak;
         }

         this.squint.synchronizeTimer(this.info);
      }
   }

   private draw(): void {
      // sync sizes
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      let width = this.canvas.width;
      let height = this.canvas.height;

      let ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = 'lightgray';
      ctx.fillRect(0, 0, width, height);

      // draw the up-down symbol
      let boxWidth = height / 2;
      let boxHeight = height;

      ctx.beginPath();
      ctx.moveTo(0.6 * boxWidth, 0.2 * boxHeight);
      ctx.lineTo(0.9 * boxWidth, 0.3 * boxHeight);
      ctx.lineTo(0.9 * boxWidth, 0.7 * boxHeight);
      ctx.lineTo(0.6 * boxWidth, 0.8 * boxHeight);
      ctx.lineTo(0.3 * boxWidth, 0.7 * boxHeight);
      ctx.lineTo(0.3 * boxWidth, 0.3 * boxHeight)
      ctx.lineTo(0.6 * boxWidth, 0.2 * boxHeight);

      ctx.fillStyle = 'rgb(230,230,230)';
      ctx.strokeStyle = 'gray';
      ctx.fill();
      ctx.stroke();

      // draw the time text
      let em = getEmPixels();
      let largeFont = (this.canvas.height - 0.5 * em);
      ctx.font = largeFont + 'px Arial';
      ctx.fillStyle = 'black';
      let size = ctx.measureText('00:00 ');

      let x = boxWidth;
      this.drawText(ctx, this.countdownTimer.timeRemainingStr, x, 0, size.width, height);
      x += size.width;

      // draw the start/stop symbols
      let boxSize = height;
      ctx.beginPath();
      if (this.countdownTimer.running) {
         // square
         let size = 0.25;
         ctx.fillStyle = 'pink';
         ctx.moveTo(x + size * boxSize, size * boxSize);
         ctx.lineTo(x + (1 - size) * boxSize, size * boxSize);
         ctx.lineTo(x + (1 - size) * boxSize, (1 - size) * boxSize);
         ctx.lineTo(x + size * boxSize, (1 - size) * boxSize);
         ctx.lineTo(x + size * boxSize, size * boxSize);
      }
      else {
         // triangle
         ctx.fillStyle = 'lightgreen';
         ctx.moveTo(x + 0.2 * boxSize, 0.2 * boxSize);
         ctx.lineTo(x + 0.8 * boxSize, 0.5 * boxSize);
         ctx.lineTo(x + 0.2 * boxSize, 0.8 * boxSize);
         ctx.lineTo(x + 0.2 * boxSize, 0.2 * boxSize);
      }
      ctx.strokeStyle = 'black';
      ctx.fill();
      ctx.stroke();
   }

   private requestTimeout(): void {
      if (this.countdownTimer.running && this.countdownTimer.expired) {
         this.soundAlarm();
      }

      this.setCanvasSize();
      this.draw();

      // trigger the next draw event
      setTimeout(() => {
         this.requestTimeout();
      }, 250);
   }

   private drawText(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, width: number, height: number) {

      let size = ctx.measureText('y'); // something with a descent

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, x + width / 2, y + height / 2 + size.actualBoundingBoxDescent / 2);

   }
}