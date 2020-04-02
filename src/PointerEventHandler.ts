import { glVec2 } from "./glVec";

type PointerScaleFunction = (scale: number, change: number) => void;
type PointerDragFunction = (pos: glVec2, delta: glVec2) => void;
type PointerUpFunction = () => void;
type PointerDownFunction = (pos: glVec2) => void;
type PointerDblClickFunction = (pos: glVec2) => boolean;
type PointerClickFunction = (pos: glVec2) => boolean;

const DBL_CLICK_TIME = 300; // ms

/**
 * Utility class for managing touch/mouse events over a html element
 */
export class PointerEventHandler {

   private element: HTMLElement;
   public mouseDown = false;

   public onUp: PointerUpFunction;
   public onDown: PointerDownFunction;
   public onScale: PointerScaleFunction
   public onClick: PointerClickFunction;
   public onDblClick: PointerDblClickFunction;
   public onDrag: PointerDragFunction;

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

         // if this is the first touch
         if (event.touches.length === 1) {

            // record the primary touch id
            this.primaryTouchId = event.touches[0].identifier;

            // send out onDown() and potentially onDblClick() events
            let pos = this.getPos(event.touches[0]);

            let time = Date.now();
            if (time - this.lastTouchTime < DBL_CLICK_TIME) {
               this.ourDblClick(pos);
            }
            else {
               this.ourOnDown(pos);
            }
            this.lastTouchTime = time;
         }
         // if this is the second touch
         else if (event.touches.length === 2 && this.primaryTouchId >= 0) {

            // record the secondary touch id. It will always be the second element when
            // there are only two elements
            this.secondaryTouchId = event.touches[1].identifier;

            // set values for gestures
            let distance = this.computeTouchDistance(event);
            this.initialTouchDistance = distance;
            this.lastTouchDistance = distance;
         }
      });

      element.addEventListener('touchmove', (event: TouchEvent) => {

         // prevent the browser from using the event
         event.preventDefault();

         // if the initial two touches are active
         if (this.primaryTouchId >= 0 && this.secondaryTouchId >= 0) {

            // send out gesture events
            let distance = this.computeTouchDistance(event);
            let scale = distance / this.initialTouchDistance;
            let change = distance / this.lastTouchDistance;
            this.ourOnScale(scale, change);
            this.lastTouchDistance = distance;
         }
         // if only the initial touch is active
         else if (this.primaryTouchId >= 0) {

            // send out the drag event
            let touch = this.getTouch(event, this.primaryTouchId);
            let pos = this.getPos(touch);
            this.ourOnDrag(pos);
         }
      });

      element.addEventListener('touchend', (event: TouchEvent) => {

         // prevent the browser from using the event
         event.preventDefault();

         if (this.secondaryTouchId >= 0) {
            if (this.getTouch(event, this.secondaryTouchId) === null) {
               this.secondaryTouchId = -1;
               this.initialTouchDistance = -1;
               this.lastTouchDistance = -1;

               // if we lifted the second finger, but not the first, go back
               // to the drag gesture, but adjust the rememberd position to
               // be the current one so that things don't jump
               let touch = this.getTouch(event, this.primaryTouchId);
               if (touch) {
                  this.lastPos = this.getPos(touch);
               }
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
         if (this.mouseDown) {
            this.ourOnDrag(pos);
         }
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

   private getPos(touch: Touch): glVec2 {
      let rect = this.element.getBoundingClientRect();
      return new glVec2([touch.clientX - rect.x, touch.clientY - rect.y]);
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

   private ourOnDrag(pos: glVec2) {
      if (this.onDrag) {
         let delta = new glVec2([pos.x - this.lastPos.x, pos.y - this.lastPos.y]);
         this.onDrag(pos.clone(), delta);
      }
      this.lastPos = pos.clone();
   }

   private ourDblClick(pos: glVec2) {

      if (this.onDblClick) {
         this.onDblClick(pos);
      }
   }

   private ourOnScale(scale: number, change: number) {
      if (this.onScale) {
         this.onScale(scale, change);
      }
   }
}