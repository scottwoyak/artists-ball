import { PlanesApp } from "./PlanesApp";
import { toRad, toDeg, clamp, isMobile } from "./Globals";
import { Vec2 } from "./Vec";
import { PointerEventHandler } from "./PointerEventHandler";
import { Profiler } from "./Profiler";

// TODO make these variables
export let textureSize = 256;
export let displaySize = 150;

export type ThresholdChangeFunction = (value: number) => void;


const NOMINAL_DISPLAY_SIZE = 150;
const NOMINAL_KNOB_LENGTH = 25;
const NOMINAL_KNOB_RADIUS = 10;

export class ThresholdCtrl {
   private canvas: HTMLCanvasElement;
   private hiddenCanvas: HTMLCanvasElement;
   private app: PlanesApp;
   private mouseOffset = new Vec2();
   private hit = 0;
   private handler: PointerEventHandler;

   private ballCenter: Vec2;
   private p1: Vec2;
   private p2: Vec2;

   private onThreshold1Change: ThresholdChangeFunction;
   private onThreshold2Change: ThresholdChangeFunction;

   public constructor(
      parent: HTMLElement,
      app: PlanesApp,
      onThreshold1Change: ThresholdChangeFunction,
      onThreshold2Change: ThresholdChangeFunction
   ) {

      if (isMobile) {
         displaySize = 300;
      }

      this.app = app;
      this.onThreshold1Change = onThreshold1Change;
      this.onThreshold2Change = onThreshold2Change;

      this.canvas = document.createElement('canvas');
      this.canvas.id = 'ThresholdCanvas';
      this.canvas.width = displaySize;
      this.canvas.height = displaySize;

      parent.appendChild(this.canvas);

      this.hiddenCanvas = document.createElement('canvas');
      this.hiddenCanvas.width = textureSize;
      this.hiddenCanvas.height = textureSize;
      this.hiddenCanvas.style.display = 'none';
      parent.appendChild(this.hiddenCanvas);

      this.handler = new PointerEventHandler(this.canvas);
      this.handler.onDown = (pos: Vec2) => this.onDown(pos);
      this.handler.onDrag = (pos: Vec2, delta: Vec2) => this.onDrag(pos, delta);
   }
   private onDown(pos: Vec2) {

      this.hitTest(pos);
   }

   private hitTest(pos: Vec2) {
      let d1 = this.p1.distance(pos);
      let d2 = this.p2.distance(pos);

      const HIT_RADIUS = NOMINAL_KNOB_RADIUS * (displaySize / NOMINAL_DISPLAY_SIZE);
      if (d1 < HIT_RADIUS && d1 <= d2) {
         this.hit = 1;
         this.mouseOffset = new Vec2([this.p1.x - pos.x, this.p1.y - pos.y]);
      }
      else if (d2 < HIT_RADIUS && d2 <= d1) {
         this.hit = 2;
         this.mouseOffset = new Vec2([this.p2.x - pos.x, this.p2.y - pos.y]);
      }
      else {
         this.hit = 0;
      }
   }

   private onDrag(pos: Vec2, delta: Vec2) {
      if (this.hit > 0) {
         let hitPt = new Vec2([pos.x + this.mouseOffset.x, pos.y + this.mouseOffset.y]);
         hitPt.x = Math.max(hitPt.x, this.ballCenter.x);
         hitPt.y = Math.min(hitPt.y, this.ballCenter.y);
         let radius = this.ballCenter.distance(hitPt);
         let angle = clamp(toDeg(Math.asin((hitPt.x - this.ballCenter.x) / radius)), 0, 90);
         if (this.hit == 1) {
            this.onThreshold1Change(angle);
         }
         else {
            this.onThreshold2Change(angle);
         }
      }
   }

   public draw() {

      let ballImageData = this.app.renderer.getBallImage();

      this.hiddenCanvas.getContext('2d').putImageData(ballImageData.image, 0, 0);

      let ctx = this.canvas.getContext('2d');
      ctx.resetTransform();
      ctx.translate(0, displaySize / 2);
      ctx.scale(displaySize / textureSize, -displaySize / textureSize);
      ctx.drawImage(this.hiddenCanvas, 0, -textureSize / 2);

      ctx.resetTransform();
      this.ballCenter = new Vec2([
         displaySize * ballImageData.ballCenter.x,
         displaySize * (1 - ballImageData.ballCenter.y)
      ]);

      ctx.fillStyle = 'limegreen';
      ctx.strokeStyle = 'black'

      const KNOB_LENGTH = NOMINAL_KNOB_LENGTH * (displaySize / NOMINAL_DISPLAY_SIZE);
      const KNOB_RADIUS = NOMINAL_KNOB_RADIUS * (displaySize / NOMINAL_DISPLAY_SIZE);
      let r = displaySize * ballImageData.ballRadius;
      let s1 = this.getPt(this.ballCenter, this.app.renderer.threshold1, r);
      this.p1 = this.getPt(this.ballCenter, this.app.renderer.threshold1, r + KNOB_LENGTH);
      let s2 = this.getPt(this.ballCenter, this.app.renderer.threshold2, r);
      this.p2 = this.getPt(this.ballCenter, this.app.renderer.threshold2, r + KNOB_LENGTH);

      ctx.lineWidth = (1 / 150) * displaySize;
      ctx.beginPath();
      ctx.moveTo(s1.x, s1.y);
      ctx.lineTo(this.p1.x, this.p1.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.p1.x, this.p1.y, KNOB_RADIUS, 0, toRad(360));
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(s2.x, s2.y);
      ctx.lineTo(this.p2.x, this.p2.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(this.p2.x, this.p2.y, KNOB_RADIUS, 0, toRad(360));
      ctx.fill();
      ctx.stroke();
   }

   private getPt(center: Vec2, threshold: number, radius: number): Vec2 {

      let oy = radius * Math.sin(toRad(90 - threshold));
      let ox = radius * Math.cos(toRad(90 - threshold));

      return new Vec2([center.x + ox, center.y - oy]);
   }
}