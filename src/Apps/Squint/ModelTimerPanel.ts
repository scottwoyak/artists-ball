import { GUI } from '../../GUI/GUI';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { baseUrl, getEmPixels } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { ITimerInfo } from './ITimerInfo';
import { ModelTimer } from './ModelTimer';
import { Rect } from './Rect';

enum HitArea {
   Up,
   Down,
   TimerText,
   StartStop,
   None,
}

export class ModelTimerPanel {
   private modelTimer: ModelTimer;
   private canvas: HTMLCanvasElement;
   private alarm: HTMLAudioElement = null;
   private box: Rect;
   private soundFile = 'sounds/gong.mp3';

   private readonly upDownWidthRatio = 0.5;
   private readonly startStopWidthRatio = 1.0;

   private get upDownWidth(): number {
      return this.box.height * this.upDownWidthRatio;
   }

   private get startStopWidth(): number {
      return this.box.height * this.startStopWidthRatio;
   }

   public get info(): ITimerInfo {
      return this.modelTimer.info;
   }

   public get width(): number {
      return this.canvas.width;
   }
   public set width(width: number) {
      this.canvas.style.width = width + 'px'
      this.canvas.width = width;
      this.draw();
   }

   public get height(): number {
      return this.canvas.height;
   }
   public set height(height: number) {
      this.canvas.style.height = height + 'px'
      this.canvas.height = height;
      this.draw();
   }

   public set sound(sound: string) {
      this.soundFile = sound;
      if (this.alarm) {
         this.alarm.src = baseUrl() + sound;
      }
   }

   public get sound(): string {
      return this.soundFile;
   }

   public constructor(modelTimer: ModelTimer, parent: HTMLElement) {

      this.modelTimer = modelTimer;

      this.modelTimer.onAlarm = (sound: boolean) => {
         if (sound) {
            this.startSound();
            this.draw();
         }
         else {
            this.stopSound();
            this.draw();
         }
      }

      this.modelTimer.onTick = () => {
         this.draw();
      }

      this.canvas = GUI.create('canvas', 'ModelTimerCanvas', parent);

      let handler = new PointerEventHandler(this.canvas);

      handler.onMove = (pos: Vec2, delta: Vec2) => {
         this.stopAlarm();

         let hit = this.hitTest(pos);
         if (hit === HitArea.Up || hit === HitArea.Down) {
            this.canvas.style.cursor = 'ns-resize';
         }
         else {
            this.canvas.style.cursor = 'default';
         }
      }

      let wasDragging = false;
      handler.onUp = (pos: Vec2) => {
         document.body.style.cursor = 'default';
         let hit = this.hitTest(pos);
         if (wasDragging === false && hit === HitArea.Up || hit === HitArea.Down) {
            if (hit === HitArea.Up) {
               this.modelTimer.addOne();
            }
            else if (hit === HitArea.Down) {
               this.modelTimer.subtractOne();
            }

            this.draw();
         }
         else if (hit === HitArea.StartStop) {
            if (this.modelTimer.running) {
               this.modelTimer.stop();
            }
            else {
               this.modelTimer.start();
            }
         }

         wasDragging = false;
      }

      let hitUpDown = false;
      let accumulatedDelta = 0;
      handler.onDown = (pos: Vec2) => {

         let hit = this.hitTest(pos);
         if (hit === HitArea.Up || hit === HitArea.Down) {
            hitUpDown = true;
         }
      }

      let step = getEmPixels() / 2;
      handler.onDrag = (pos: Vec2, delta: Vec2) => {
         if (hitUpDown === true) {
            document.body.style.cursor = 'ns-resize';
            accumulatedDelta += delta.y;
            while (accumulatedDelta > step) {
               wasDragging = true;
               this.modelTimer.subtractOne();
               accumulatedDelta -= step;
            }
            while (accumulatedDelta < -step) {
               wasDragging = true;
               this.modelTimer.addOne();
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

   public playSound(): void {
      this.alarm.loop = false;
      this.alarm.currentTime = 0;
      this.alarm.play()
         .catch((err) => { console.log('Cannot play alarm: ' + err) });
   }

   private hitTest(pos: Vec2): HitArea {

      if (pos.x < this.box.left || pos.x > this.box.right || pos.y < this.box.top || pos.y > this.box.bottom) {
         return HitArea.None;
      }

      if (pos.x < this.box.left + this.upDownWidth) {
         if (pos.y < this.box.top - this.box.height / 2) {
            return HitArea.Up;
         }
         else {
            return HitArea.Down;
         }
      }
      else if (pos.x < this.box.right - this.startStopWidth) {
         return HitArea.TimerText;
      }
      else {
         return HitArea.StartStop;
      }
   }

   private initAudio(): void {
      // create via html instead of new Audio() which is blocked on portable ios
      if (this.alarm === null) {
         this.alarm = GUI.create('audio', 'AlarmAudio', document.body);
         this.alarm.src = baseUrl() + this.soundFile;
      }
   }

   private getOptimalSize(): Rect {
      let width = this.canvas.width;
      let height = this.canvas.height;

      let em = getEmPixels();
      let fontSize = (height - 0.5 * em);

      let ctx = this.canvas.getContext('2d');
      ctx.font = fontSize + 'px Arial';
      let size = ctx.measureText('00:00');

      let desiredHeight = height;
      let desiredWidth = this.upDownWidthRatio * height + size.width + this.startStopWidthRatio * height;
      let AR = desiredWidth / desiredHeight;

      if (desiredWidth > width) {
         desiredWidth = width;
         desiredHeight = desiredWidth / AR;
      }

      let x = (width - desiredWidth) / 2;
      let y = (height - desiredHeight) / 2;
      return new Rect(x, y, desiredWidth, desiredHeight);
   }

   private startSound() {
      if (this.alarm) {
         this.alarm.currentTime = 0;
         this.alarm.loop = true;
         this.alarm.play().catch((err) => { console.log('Cannot play alarm: ' + err) });
      }
   }

   private stopSound() {
      this.alarm.pause();
      this.alarm.currentTime = 0;
   }

   private stopAlarm() {
      if (this.modelTimer.alarmSounding) {
         this.modelTimer.reset();
      }
   }

   private draw(): void {

      let style = getComputedStyle(this.canvas);

      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      this.box = this.getOptimalSize();

      let x = this.box.x;
      let y = this.box.y;

      let ctx = this.canvas.getContext('2d');
      ctx.fillStyle = this.modelTimer.alarmSounding ? 'orange' : style.backgroundColor ?? 'lightgray';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // draw the up-down symbol
      let boxWidth = this.upDownWidth;
      let boxHeight = this.box.height;

      ctx.beginPath();
      ctx.moveTo(x + 0.5 * boxWidth, y + 0.2 * boxHeight);
      ctx.lineTo(x + 0.8 * boxWidth, y + 0.3 * boxHeight);
      ctx.lineTo(x + 0.8 * boxWidth, y + 0.7 * boxHeight);
      ctx.lineTo(x + 0.5 * boxWidth, y + 0.8 * boxHeight);
      ctx.lineTo(x + 0.2 * boxWidth, y + 0.7 * boxHeight);
      ctx.lineTo(x + 0.2 * boxWidth, y + 0.3 * boxHeight)
      ctx.lineTo(x + 0.5 * boxWidth, y + 0.2 * boxHeight);

      ctx.fillStyle = 'rgba(128,128,128, 0.3)';
      ctx.strokeStyle = 'rgba(128,128,128,1)';
      ctx.fill();
      ctx.stroke();

      // draw the time text
      let em = getEmPixels();
      let fontSize = (this.box.height - 0.5 * em);
      ctx.font = fontSize + 'px Arial';
      ctx.fillStyle = style.color ?? 'black';
      let size = ctx.measureText('00:00');

      x += boxWidth;
      this.drawText(ctx, this.modelTimer.timeRemainingStr, x, y, size.width, this.box.height);
      x += size.width;

      // draw the start/stop symbols
      let boxSize = this.box.height;
      ctx.beginPath();
      if (this.modelTimer.running) {
         // square
         let size = 0.25;
         ctx.fillStyle = 'rgba(255,128,128,0.3)';
         ctx.strokeStyle = 'rgba(255,0,0,0.8)';
         ctx.moveTo(x + size * boxSize, y + size * boxSize);
         ctx.lineTo(x + (1 - size) * boxSize, y + size * boxSize);
         ctx.lineTo(x + (1 - size) * boxSize, y + (1 - size) * boxSize);
         ctx.lineTo(x + size * boxSize, y + (1 - size) * boxSize);
         ctx.lineTo(x + size * boxSize, y + size * boxSize);
      }
      else {
         // triangle
         //ctx.fillStyle = 'lightgreen';
         ctx.fillStyle = 'rgba(128,255,128,0.4)';
         ctx.strokeStyle = 'rgba(0,200,0,0.9)';
         ctx.moveTo(x + 0.2 * boxSize, y + 0.2 * boxSize);
         ctx.lineTo(x + 0.8 * boxSize, y + 0.5 * boxSize);
         ctx.lineTo(x + 0.2 * boxSize, y + 0.8 * boxSize);
         ctx.lineTo(x + 0.2 * boxSize, y + 0.2 * boxSize);
      }
      //ctx.strokeStyle = 'black';
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