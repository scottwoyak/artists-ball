import { GUI } from '../../GUI/GUI';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { baseUrl, getEmPixels } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { Squint } from './Squint';
import { ITimerInfo } from './ITimerInfo';

export class ModelTimerPanel {
   private squint: Squint;
   private canvas: HTMLCanvasElement;
   private alarm: HTMLAudioElement = null;

   public get info(): ITimerInfo {
      return this.squint.modelTimer.info;
   }

   public constructor(squint: Squint, parent: HTMLElement) {
      this.squint = squint;

      this.squint.modelTimer.onAlarm = (sound: boolean) => {
         if (sound) {
            this.startSound();
            this.draw();
         }
         else {
            this.stopSound();
            this.draw();
         }
      }

      this.squint.modelTimer.onTick = () => {
         this.draw();
      }

      this.canvas = GUI.create('canvas', 'ModelTimerCanvas', parent);

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
               this.squint.modelTimer.addOne();
            }
            else {
               this.squint.modelTimer.subtractOne();
            }

            this.draw();
         }
         else if (pos.x > width - boxSize) {
            if (this.squint.modelTimer.running) {
               this.squint.modelTimer.stop();
            }
            else {
               this.squint.modelTimer.start();
            }
         }

         wasDragging = false;
      }

      let hit = false;
      let accumulatedDelta = 0;
      handler.onDown = (pos: Vec2) => {

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
               this.squint.modelTimer.subtractOne();
               accumulatedDelta -= step;
            }
            while (accumulatedDelta < -step) {
               wasDragging = true;
               this.squint.modelTimer.addOne();
               accumulatedDelta += step;
            }

            this.draw();
         }
      }

      document.body.addEventListener('mousedown', () => {
         this.stopAlarm();
         this.initAudio();
      });
      document.body.addEventListener('touchstart', () => {
         this.stopAlarm();
         this.initAudio();
      });

      this.draw();
   }

   private initAudio(): void {
      // create via html instead of new Audio() which is blocked on portable ios
      if (this.alarm === null) {
         this.alarm = GUI.create('audio', 'AlarmAudio', document.body);
         this.alarm.src = baseUrl() + 'sounds/timer.mp3';
         this.alarm.loop = true;
      }
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

   private startSound() {
      if (this.alarm) {
         this.alarm.currentTime = 0;
         this.alarm.play().catch((err) => { console.log('Cannot play alarm: ' + err) });
      }
   }

   private stopSound() {
      this.alarm.pause();
      this.alarm.currentTime = 0;
   }

   private stopAlarm() {
      if (this.squint.modelTimer.alarmSounding) {
         this.squint.modelTimer.reset();
      }
   }

   private draw(): void {
      this.setCanvasSize();

      // sync sizes
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      let width = this.canvas.width;
      let height = this.canvas.height;

      let ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.fillStyle = this.squint.modelTimer.alarmSounding ? 'orange' : 'lightgray';
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
      this.drawText(ctx, this.squint.modelTimer.timeRemainingStr, x, 0, size.width, height);
      x += size.width;

      // draw the start/stop symbols
      let boxSize = height;
      ctx.beginPath();
      if (this.squint.modelTimer.running) {
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

   private drawText(ctx: CanvasRenderingContext2D, str: string, x: number, y: number, width: number, height: number) {

      let size = ctx.measureText('y'); // something with a descent

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(str, x + width / 2, y + height / 2 + size.actualBoundingBoxDescent / 2);

   }
}