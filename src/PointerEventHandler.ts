import { glVec2 } from "./glVec";

type PointerEventVoidFunction = (pos: glVec2) => void;
type PointerEventBooleanFunction = (pos: glVec2) => boolean;
type PointerEventScaleFunction = (scale: number, change: number) => void;

const DBL_CLICK_TIME = 300; // ms

/**
 * Utility class for managing touch/mouse events over a html element
 */
export class PointerEventHandler {

   private element: HTMLElement;
   public mouseDown = false;

   public onUp: VoidFunction;
   public onDown: PointerEventVoidFunction;
   public onMove: PointerEventVoidFunction;
   public onScale: PointerEventScaleFunction
   public onClick: PointerEventBooleanFunction;
   public onDblClick: PointerEventVoidFunction;

   public lastPos: glVec2;
   private lastTouchTime: number;
   private primaryTouchId: number = -1;
   private secondaryTouchId: number = -1;
   private initialTouchDistance: number;
   private lastTouchDistance: number;

   public constructor(element: HTMLElement) {

      this.element = element;

      // element.ontouch isn't supported on desktop devices
      element.addEventListener('touchstart', (event: TouchEvent) => {

         // prevent the browser from using the event
         event.preventDefault();

         if (event.touches.length === 1) {
            this.primaryTouchId = event.touches[0].identifier;

            let rect = this.element.getBoundingClientRect();
            let pos = new glVec2([event.touches[0].clientX - rect.x, event.touches[0].clientY - rect.y]);

            let time = Date.now();
            if (time - this.lastTouchTime < DBL_CLICK_TIME) {
               this.ourDblClick(pos);
            }
            else {
               this.ourOnDown(pos);
            }
            this.lastTouchTime = time;
         }
         else if (event.touches.length === 2) {
            this.secondaryTouchId = event.touches[1].identifier;
            let distance = this.computeTouchDistance(event);
            this.initialTouchDistance = distance;
            this.lastTouchDistance = distance;
         }
      });

      element.addEventListener('touchmove', (event: TouchEvent) => {
         event.preventDefault();

         if (this.primaryTouchId >= 0 && this.secondaryTouchId >= 0) {

            let distance = this.computeTouchDistance(event);
            let scale = distance / this.initialTouchDistance;
            let change = distance / this.lastTouchDistance;
            if (this.onScale) {
               this.onScale(scale, change);
            }
            this.lastTouchDistance = distance;
         }
         let touch = this.getTouch(event, this.primaryTouchId);

         if (touch) {
            let rect = this.element.getBoundingClientRect();
            let pos = new glVec2([event.touches[0].clientX - rect.x, event.touches[0].clientY - rect.y]);
            this.ourOnMove(pos);
         }
      });

      element.addEventListener('touchend', (event: TouchEvent) => {

         event.preventDefault();

         if (this.secondaryTouchId >= 0) {
            if (this.getTouch(event, this.secondaryTouchId) === null) {
               this.secondaryTouchId = -1;
               this.initialTouchDistance = -1;
               this.lastTouchDistance = -1;
            }
         }

         if (this.primaryTouchId >= 0) {
            if (this.getTouch(event, this.primaryTouchId) === null) {
               this.primaryTouchId = -1;
               this.initialTouchDistance = -1;
               this.lastTouchDistance = -1;

               this.ourOnUp();
            }
         }
      });

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

      element.ondblclick = (event: MouseEvent) => {
         let pos = new glVec2([(<any>event).layerX, (<any>event).layerY]);
         this.ourDblClick(pos);
      }
   }

   private getTouch(event: TouchEvent, id: number): Touch {

      for (let i = 0; i < event.touches.length; i++) {
         let touch = event.touches[i];
         if (touch.identifier === id) {
            return touch;
         }
      }

      // no match was found
      return null;
   }

   private computeTouchDistance(event: TouchEvent): number {

      if (this.primaryTouchId < 0 || this.secondaryTouchId < 0) {
         throw Error('Two touches expected');
      }

      let touch1 = this.getTouch(event, this.primaryTouchId);
      let touch2 = this.getTouch(event, this.secondaryTouchId);

      let x1 = touch1.screenX;
      let y1 = touch1.screenY;
      let x2 = touch2.screenX;
      let y2 = touch2.screenY;

      return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
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

   private ourDblClick(pos: glVec2) {

      if (this.onDblClick) {
         this.onDblClick(pos);
      }
   }
}