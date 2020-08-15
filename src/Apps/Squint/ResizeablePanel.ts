import { Panel } from './Panel';
import { Vec2 } from '../../Util3D/Vec';
import { PointerEventHandler } from '../../GUI/PointerEventHandler';

export class ResizeablePanel extends Panel {

   protected constructor(parent: HTMLElement, id: string, displayStyleForShow = 'block') {
      super(parent, id, displayStyleForShow);

      const handler = new PointerEventHandler(this.div);
      handler.onDrag = (pos: Vec2, delta: Vec2) => {
         if (window.event.target instanceof HTMLInputElement === false) {
            this.onDrag(pos, delta);
         }
      }
   }

   private onDrag(pos: Vec2, delta: Vec2) {
      const oldStyle = getComputedStyle(this.div);
      const oldX = this.pxToFloat(oldStyle.left);
      const oldY = this.pxToFloat(oldStyle.top);
      this.div.style.top = (oldY + delta.y) + 'px';
      this.div.style.left = (oldX + delta.x) + 'px';
   }

   private pxToFloat(value: string): number {
      return Number.parseFloat(value.substr(0, value.length - 2));
   }
}