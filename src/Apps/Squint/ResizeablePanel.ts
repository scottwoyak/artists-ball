import { Panel } from "./Panel";
import { Vec2 } from "../../Util3D/Vec";
import { PointerEventHandler } from "../../GUI/PointerEventHandler";

export class ResizeablePanel extends Panel {
   private lastPos = new Vec2();

   protected constructor(parent: HTMLElement, id: string, displayStyleForShow = 'block') {
      super(parent, id, displayStyleForShow);

      let handler = new PointerEventHandler(this.div);
      handler.onDrag = (pos: Vec2, delta: Vec2) => {
         if (window.event.target instanceof HTMLInputElement === false) {
            this.onDrag(pos, delta);
         }
      }
   }

   /*
   private onMouseDown(event: MouseEvent) {

      this.lastPos.x = event.clientX;
      this.lastPos.y = event.clientY;
      document.onmouseup = (event: MouseEvent) => { this.onMouseUp(event); }
      document.onmousemove = (event: MouseEvent) => { this.onMouseMove(event); }
   }

   private onMouseUp(event: MouseEvent) {
      event.preventDefault();

      document.onmouseup = null;
      document.onmousemove = null;
   }

   private onMouseMove(event: MouseEvent) {
      event.preventDefault();

      let newPos = new Vec2([event.clientX, event.clientY]);
      let delta = new Vec2([this.lastPos.x - newPos.x, this.lastPos.y - newPos.y]);
      this.lastPos = newPos;

      this.div.style.top = (this.div.offsetTop - delta.y) + "px";
      this.div.style.left = (this.div.offsetLeft - delta.x) + "px";
   }
   */

   private onDrag(pos: Vec2, delta: Vec2) {
      let oldStyle = getComputedStyle(this.div);
      let oldX = this.pxToFloat(oldStyle.left);
      let oldY = this.pxToFloat(oldStyle.top);
      //this.div.style.top = (this.div.offsetTop + delta.y) + "px";
      //this.div.style.left = (this.div.offsetLeft + delta.x) + "px";
      this.div.style.top = (oldY + delta.y) + "px";
      this.div.style.left = (oldX + delta.x) + "px";
   }

   private pxToFloat(value: string): number {
      return Number.parseFloat(value.substr(0, value.length - 2));
   }
}