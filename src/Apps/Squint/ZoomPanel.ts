import { GUI } from '../../GUI/GUI';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';
import { Vec2 } from '../../Util3D/Vec';

export type ChangeHandler = () => void;

export class ZoomPanel {
   private canvas: HTMLCanvasElement;

   public onChange: ChangeHandler = null;

   private _zoom = 1;
   private minZoom = 0.5;
   private maxZoom = 5;

   public get zoom(): number {
      return this._zoom;
   }
   public set zoom(value: number) {

      if (this._zoom !== value) {
         this._zoom = value;
         this.draw();

         if (this.onChange) {
            this.onChange();
         }
      }
   }

   public constructor(parent: HTMLElement) {

      this.canvas = GUI.create('canvas', 'ZoomCanvas', parent);

      let handler = new PointerEventHandler(this.canvas);

      let dragging = false;
      let offset = -1;
      handler.onDown = (pos: Vec2) => {
         dragging = true;
         offset = pos.y - this.zoomToY(this._zoom);
      }

      handler.onMove = (pos: Vec2) => {
         let center = new Vec2([this.canvas.width / 2, this.zoomToY(this._zoom)]);
         let radius = this.canvas.width / 2;
         if (pos.distance(center) < radius) {
            this.canvas.style.cursor = 'ns-resize';
         }
         else {
            this.canvas.style.cursor = 'default';
         }
      }

      handler.onDrag = (pos: Vec2, delta: Vec2) => {

         if (dragging) {
            let y = pos.y - offset;
            this.zoom = this.yToZoom(y);
         }
      }

      handler.onUp = (pos: Vec2) => {
         dragging = false;
         offset = 0;
      }

      window.addEventListener('resize', () => {
         this.draw();
      });

      this.draw();
   }

   private zoomToY(zoom: number): number {

      zoom = Math.min(this.maxZoom, Math.max(this.minZoom, this.zoom));

      let height = this.canvas.height;
      let radius = this.canvas.width / 2;
      let zoomRange = this.maxZoom - this.minZoom;

      return radius + ((this.maxZoom - zoom) / (zoomRange)) * (height - 2 * radius);
   }

   private yToZoom(y: number): number {

      let height = this.canvas.height;
      let radius = this.canvas.width / 2;
      let zoomRange = this.maxZoom - this.minZoom;

      let zoom = this.maxZoom - (y - radius) / (height - 2 * radius) * (zoomRange);
      return Math.min(this.maxZoom, Math.max(this.minZoom, zoom));
   }

   private draw(): void {

      this.canvas.width = this.canvas.clientWidth;
      this.canvas.height = this.canvas.clientHeight;
      let width = this.canvas.width;

      let style = getComputedStyle(this.canvas);

      // clear everything
      let ctx = this.canvas.getContext('2d');
      ctx.fillStyle = style.backgroundColor ?? 'lightgray';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // draw magnifying glass
      let x = width / 2;
      let y = this.zoomToY(this._zoom);
      let radius = width / 2;

      ctx.beginPath();
      ctx.strokeStyle = 'black';
      ctx.fillStyle = 'white';
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.45 * radius, y + 0.45 * radius);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(x - 0.2 * radius, y - 0.2 * radius, 0.4 * radius, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.fill();
   }
}