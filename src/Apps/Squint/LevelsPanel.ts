import { GUI } from '../../GUI/GUI';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { clamp, getEmPixels } from '../../Util/Globals';
import { Vec2 } from '../../Util3D/Vec';
import { ResizeablePanel } from './ResizeablePanel';

enum HitItem {
   Black,
   White,
   Both,
   Mid,
   None
}

class Hit {
   public offsetX = 0;
   public offsetY = 0;
   public item: HitItem = HitItem.None;
}

interface IPoints {
   black: Vec2,
   white: Vec2,
   mid: Vec2,
}
export type ChangeHandler = () => void;

export class LevelsPanel extends ResizeablePanel {

   private canvas: HTMLCanvasElement;
   private margin: number;
   private radius: number;
   private lineWidth: number;

   public white = 1;
   public black = 0;
   public midPoint = 0.5;
   public midValue = 0.5;

   public onChange: ChangeHandler = null;

   public constructor(parent: HTMLElement) {
      super(parent, 'LevelsPanelDiv', 'Flex', 'LevelsPanel');

      const viewersTitleDiv = GUI.create('div', 'TitleDiv', this.div);
      viewersTitleDiv.className = 'TitleClass';
      viewersTitleDiv.innerText = 'Levels';

      const closeButton = GUI.create('button', 'LevelsPanelCloseButton', viewersTitleDiv);
      closeButton.className = 'ButtonClass';
      closeButton.innerText = 'X';
      closeButton.onclick = () => {
         this.visible = false;
      }

      this.canvas = GUI.create('canvas', 'AfterCanvas', this.div);

      let handler = new PointerEventHandler(this.canvas);

      let hit: Hit;
      handler.onDown = (pos: Vec2) => {
         hit = this.getHit(pos);
      }

      handler.onMove = (pos: Vec2) => {
         let hit = this.getHit(pos);
         switch (hit.item) {
            case HitItem.Black:
            case HitItem.White:
               this.canvas.style.cursor = 'ew-resize'
               break;
            case HitItem.Mid:
               this.canvas.style.cursor = 'move'
               break;

            case HitItem.Both:
               this.canvas.style.cursor = 'default'
               break;
         }
      }

      const minDelta = 0.01;
      handler.onDrag = (pos: Vec2, delta: Vec2) => {
         switch (hit.item) {
            case HitItem.Black:
               this.black = clamp((pos.x + hit.offsetX) / this.canvas.width, 0, 1 - minDelta);
               this.white = Math.max(this.white, this.black + minDelta);
               this.draw();
               if (this.onChange) {
                  this.onChange();
               }
               break;
            case HitItem.White:
               this.white = clamp((pos.x + hit.offsetX) / this.canvas.width, minDelta, 1);
               this.black = Math.min(this.black, this.white - minDelta);
               this.draw();
               if (this.onChange) {
                  this.onChange();
               }
               break;
            case HitItem.Mid:
               let pts = this.computePoints();
               this.midPoint = clamp((pos.x + hit.offsetX - pts.black.x) / (pts.white.x - pts.black.x), 0, 1);
               this.midValue = clamp(1 - (pos.y + hit.offsetY) / this.canvas.height, 0, 1);
               this.draw();
               if (this.onChange) {
                  this.onChange();
               }
               break;

            case HitItem.Both:
               let delta = this.white - this.black;
               this.black = clamp((pos.x + hit.offsetX) / this.canvas.width, 0, 1 - delta);
               this.white = this.black + delta;
               this.draw();
               if (this.onChange) {
                  this.onChange();
               }
               break;
         }
      }

      let em = getEmPixels();
      this.radius = 0.8 * em;
      this.margin = 0.9 * em;
      this.lineWidth = 0.1 * em;

      this.draw();
   }

   private getHit(pos: Vec2): Hit {
      let hit = new Hit();
      let epsilon = 3.0 * this.radius;
      let pts = this.computePoints();
      if (pos.distance(pts.mid) < epsilon) {
         hit.item = HitItem.Mid;
         hit.offsetX = pts.mid.x - pos.x;
         hit.offsetY = pts.mid.y - pos.y;
      }
      else if (pos.distance(pts.black) < epsilon) {
         hit.item = HitItem.Black;
         hit.offsetX = pts.black.x - pos.x;
      }
      else if (pos.distance(pts.white) < epsilon) {
         hit.item = HitItem.White;
         hit.offsetX = pts.white.x - pos.x;
      }
      else {
         hit.item = HitItem.Both;
         hit.offsetX = pts.black.x - pos.x;
      }
      return hit;
   }

   private draw(): void {

      // work around for the canvas not being initialized yet when calling
      // this function from the constructor. Isn't there an event for this?
      if (this.canvas.clientWidth === 0) {
         setTimeout(() => {
            this.draw();
         }, 10);
         return;
      }

      // sync sizes
      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;

      // short-hand var names
      let width = this.canvas.width - 2 * this.margin;
      let height = this.canvas.height - 2 * this.margin;
      let pts = this.computePoints();

      let ctx = this.canvas.getContext('2d');

      // draw the background
      let grd = ctx.createLinearGradient(this.margin, 0, this.margin + width, 0);
      grd.addColorStop(0, 'black');
      grd.addColorStop(this.black, 'black');
      let pos = this.black + this.midPoint * (this.white - this.black);
      let rgb = Math.round(255 * this.midValue);
      grd.addColorStop(pos, 'rgb(' + rgb + ',' + rgb + ',' + rgb + ')');
      grd.addColorStop(this.white, 'white');
      grd.addColorStop(1, 'white');

      ctx.fillStyle = grd;
      ctx.fillRect(this.margin, this.margin, width, height);

      // draw lines
      ctx.strokeStyle = 'lightgreen';
      ctx.lineWidth = 2 * this.lineWidth;
      ctx.beginPath();
      ctx.moveTo(this.margin + this.black * width, this.margin + height);
      ctx.lineTo(pts.mid.x, pts.mid.y);
      ctx.lineTo(this.margin + this.white * width, this.margin);
      ctx.stroke();

      // handles
      ctx.fillStyle = 'lightgreen';
      ctx.strokeStyle = 'darkgreen'
      ctx.lineWidth = this.lineWidth;

      ctx.beginPath();
      ctx.arc(pts.black.x, pts.black.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pts.white.x, pts.white.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(pts.mid.x, pts.mid.y, this.radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
   }

   private computePoints(): IPoints {
      // short-hand var names
      let m = this.margin;
      let width = this.canvas.width - 2 * m;
      let height = this.canvas.height - 2 * m;

      return {
         black: new Vec2([m + this.black * width, m + height]),
         white: new Vec2([m + this.white * width, m]),
         mid: new Vec2([m + (this.black + this.midPoint * (this.white - this.black)) * width, m + (1 - this.midValue) * height]),
      }
   }
}