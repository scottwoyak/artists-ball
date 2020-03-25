import { glVec2 } from "./glVec";

type PointerEventVoidFunction = (pos: glVec2) => void;
type PointerEventBooleanFunction = (pos: glVec2) => boolean;

/**
 * Utility class for managing touch/mouse events over a html element
 */
export class PointerEventHandler {

   private element: HTMLElement;
   public mouseDown = false;

   public onUp: VoidFunction;
   public onDown: PointerEventVoidFunction;
   public onMove: PointerEventVoidFunction;
   public onClick: PointerEventBooleanFunction;

   public lastPos: glVec2;

   public constructor(element: HTMLElement) {

      this.element = element;
      element.ontouchstart = (event: TouchEvent) => {
         event.preventDefault();
         if (event.touches.length === 1) {
            let rect = this.element.getBoundingClientRect();
            let pos = new glVec2([event.touches[0].clientX - rect.x, event.touches[0].clientY - rect.y]);
            this.ourOnDown(pos);
         }
      }

      element.ontouchmove = (event: TouchEvent) => {
         event.preventDefault();
         let rect = this.element.getBoundingClientRect();
         let pos = new glVec2([event.touches[0].clientX - rect.x, event.touches[0].clientY - rect.y]);
         this.ourOnMove(pos);
      }

      element.ontouchend = (event: TouchEvent) => {
         event.preventDefault();
         this.ourOnUp();
      }

      element.onmousedown = (event: MouseEvent) => {
         let pos = new glVec2([(<any>event).layerX, (<any>event).layerY]);
         this.ourOnDown(pos);

         // disable selection because dragging is used for rotating the camera and moving objects
         return false;
      }

      element.onmousemove = (event: MouseEvent) => {
         let pos = new glVec2([(<any>event).layerX, (<any>event).layerY]);
         this.ourOnMove(pos);
      }

      element.onmouseup = (event: MouseEvent) => {
         this.ourOnUp();
      };

      element.onmouseleave = (event) => {
         this.mouseDown = false;
      }
   }

   private ourOnDown(pos: glVec2) {
      if (this.onClick && this.onClick(pos.clone())) {
         return;
      }
      else {
         this.mouseDown = true;
         this.lastPos = pos.clone();

         if (this.onDown) {
            this.onDown(pos.clone());
         }
      }
   }

   private ourOnUp() {

      this.mouseDown = false;

      if (this.onUp) {
         this.onUp();
      }
   }

   private ourOnMove(pos: glVec2) {
      if (this.onMove) {
         this.onMove(pos.clone());
      }
      this.lastPos = pos.clone();
   }
}