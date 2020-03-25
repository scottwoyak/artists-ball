import { PlanesApp } from "./PlanesApp";
import { toRad, toDeg, clamp } from "./Globals";
import { glVec2 } from "./glVec";

// TODO make these variables
export let textureSize = 256;
export let displaySize = 150;

export class ThresholdCtrl {
   private canvas: HTMLCanvasElement;
   private hiddenCanvas: HTMLCanvasElement;
   private app: PlanesApp;
   private mouseDown = false;
   private mouseOffset = new glVec2();
   private hit = 0;

   private ballCenter: glVec2;
   private p1: glVec2;
   private p2: glVec2;

   public constructor(parent: HTMLElement, app: PlanesApp) {

      this.app = app;
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

      this.canvas.ontouchstart = (event: TouchEvent) => {
         event.preventDefault();
         if (event.touches.length === 1) {

            this.onDown(event.touches[0].clientX, event.touches[0].clientY);
         }
      }

      this.canvas.ontouchmove = (event: TouchEvent) => {
         event.preventDefault();
         this.onMove(event.touches[0].clientX, event.touches[0].clientY);
      }

      this.canvas.ontouchend = (event: TouchEvent) => {
         event.preventDefault();
         this.mouseDown = false;
      }

      this.canvas.onmousedown = (event: MouseEvent) => {
         this.onDown(event.x - this.canvas.offsetLeft, event.y - this.canvas.offsetTop);

         // disable selection because dragging is used for rotating the camera and moving objects
         return false;
      }

      this.canvas.onmousemove = (event: MouseEvent) => {
         this.onMove(event.x - this.canvas.offsetLeft, event.y - this.canvas.offsetTop);
      }

      this.canvas.onmouseup = (event) => {
         this.mouseDown = false;
      };

      this.canvas.onmouseleave = (event) => {
         this.mouseDown = false;
      }

   }
   private onDown(x: number, y: number) {

      this.hitTest(x, y);

      this.mouseDown = true;
   }

   private hitTest(x: number, y: number) {
      let d1 = this.p1.distance(new glVec2([x, y]));
      let d2 = this.p2.distance(new glVec2([x, y]));

      const HIT_RADIUS = 15;
      if (d1 < HIT_RADIUS && d1 <= d2) {
         this.hit = 1;
         this.mouseOffset = new glVec2([this.p1.x - x, this.p1.y - y]);
      }
      else if (d2 < HIT_RADIUS && d2 <= d1) {
         this.hit = 2;
         this.mouseOffset = new glVec2([this.p2.x - x, this.p2.y - y]);
      }
      else {
         this.hit = 0;
      }
   }

   private onMove(x: number, y: number) {
      if (this.mouseDown && this.hit > 0) {
         let hitPt = new glVec2([x - this.mouseOffset.x, y - this.mouseOffset.y]);
         hitPt.x = Math.max(hitPt.x, this.ballCenter.x);
         hitPt.y = Math.min(hitPt.y, this.ballCenter.y);
         let radius = this.ballCenter.distance(hitPt);
         let angle = toDeg(Math.asin((hitPt.x - this.ballCenter.x) / radius));
         if (this.hit == 1) {
            this.app.threshold1 = clamp(angle, 0, 90);
         }
         else {
            this.app.threshold2 = clamp(angle, 0, 90);
         }
         //this.draw();

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
      this.ballCenter = new glVec2([
         displaySize * ballImageData.ballCenter.x,
         displaySize * (1 - ballImageData.ballCenter.y)
      ]);

      ctx.fillStyle = 'limegreen';
      ctx.strokeStyle = 'black'

      const KNOB_LENGTH = 25;
      const KNOB_RADIUS = 8;
      let r = displaySize * ballImageData.ballRadius;
      let s1 = this.getPt(this.ballCenter, this.app.renderer.threshold1, r);
      this.p1 = this.getPt(this.ballCenter, this.app.renderer.threshold1, r + KNOB_LENGTH);
      let s2 = this.getPt(this.ballCenter, this.app.renderer.threshold2, r);
      this.p2 = this.getPt(this.ballCenter, this.app.renderer.threshold2, r + KNOB_LENGTH);

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

   private getPt(center: glVec2, threshold: number, radius: number): glVec2 {

      let oy = radius * Math.sin(toRad(90 - threshold));
      let ox = radius * Math.cos(toRad(90 - threshold));

      return new glVec2([center.x + ox, center.y - oy]);
   }
}