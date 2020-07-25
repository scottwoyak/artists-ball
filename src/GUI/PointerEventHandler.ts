import { Vec2 } from "../Util3D/Vec";

type PointerRotateFunction = (angle: number, delta: number) => void;
type PointerTranslateFunction = (delta: Vec2) => void;
type PointerScaleFunction = (scale: number, change: number) => void;
type PointerDragFunction = (pos: Vec2, delta: Vec2) => void;
type PointerUpFunction = () => void;
type PointerDownFunction = (pos: Vec2) => void;
type PointerDblClickFunction = (pos: Vec2) => boolean;
type PointerClickFunction = (pos: Vec2) => boolean;

const DBL_CLICK_TIME = 300; // ms

/**
 * Utility class for managing touch/mouse events over a html element
 */
export class PointerEventHandler {

   private element: HTMLElement;
   public mouseDown = false;

   public onUp: PointerUpFunction;
   public onDown: PointerDownFunction;
   public onScale: PointerScaleFunction;
   public onRotate: PointerRotateFunction;
   public onTranslate: PointerTranslateFunction;
   public onClick: PointerClickFunction;
   public onDblClick: PointerDblClickFunction;
   public onDrag: PointerDragFunction;
   public ctrlKey = false;

   public lastPos: Vec2;
   private lastTouchTime: number;
   private primaryTouchId: number = -1;
   private secondaryTouchId: number = -1;
   private initialTouchDistance: number;
   private lastTouchDistance: number;
   private lastTouchAngle: number;
   private lastTouchCenter: Vec2;

   public constructor(element: HTMLElement) {

      this.element = element;

      // element.ontouch isn't supported on desktop devices so use addEventListener instead
      element.addEventListener('touchstart', (event: TouchEvent) => {

         this.ctrlKey = event.ctrlKey;

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
            this.lastTouchAngle = this.computeTouchAngle(event);
            this.lastTouchCenter = this.computeTouchCenter(event);
         }
      });

      element.addEventListener('touchmove', (event: TouchEvent) => {

         this.ctrlKey = event.ctrlKey;

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

            let angle = this.computeTouchAngle(event);
            this.ourOnRotate(angle, angle - this.lastTouchAngle);
            this.lastTouchAngle = angle;

            let center = this.computeTouchCenter(event);
            // reverse Y values so the bottom is zero instead of the top
            let delta = [center.x - this.lastTouchCenter.x, this.lastTouchCenter.y - center.y];
            this.ourOnTranslate(new Vec2(delta));
            this.lastTouchCenter = center;
         }
         // if only the initial touch is active
         else if (this.primaryTouchId >= 0) {

            // send out the drag event
            if (this.mouseDown) {
               let touch = this.getTouch(event, this.primaryTouchId);
               let pos = this.getPos(touch);
               this.ourOnDrag(pos);
            }
         }
      });

      element.addEventListener('touchend', (event: TouchEvent) => {

         this.ctrlKey = event.ctrlKey;

         // prevent the browser from using the event
         event.preventDefault();

         if (this.secondaryTouchId >= 0) {
            if (this.getTouch(event, this.secondaryTouchId) === null) {
               this.secondaryTouchId = -1;

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

               this.ourOnUp();
            }
         }

         if (this.secondaryTouchId === -1 || this.primaryTouchId === -1) {
            this.initialTouchDistance = -1;
            this.lastTouchDistance = -1;
            this.lastTouchAngle = -1;
            this.lastTouchCenter = new Vec2([-1, -1]);
         }
      });

      element.onmousedown = (event: MouseEvent) => {

         this.ctrlKey = event.ctrlKey;

         let pos = new Vec2([(<any>event).layerX, (<any>event).layerY]);
         this.ourOnDown(pos);

         // disable selection because dragging is used for rotating the camera and moving objects
         return false;
      }

      element.onmousemove = (event: MouseEvent) => {

         this.ctrlKey = event.ctrlKey;

         let pos = new Vec2([(<any>event).layerX, (<any>event).layerY]);
         if (this.mouseDown) {
            this.ourOnDrag(pos);
         }
      }

      element.onmouseup = (event: MouseEvent) => {

         this.ctrlKey = event.ctrlKey;

         this.ourOnUp();
      };

      element.onmouseleave = (event) => {
         this.mouseDown = false;
      }

      element.ondblclick = (event: MouseEvent) => {

         this.ctrlKey = event.ctrlKey;

         let pos = new Vec2([(<any>event).layerX, (<any>event).layerY]);
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

   private getPos(touch: Touch): Vec2 {
      let rect = this.element.getBoundingClientRect();
      return new Vec2([touch.clientX - rect.x, touch.clientY - rect.y]);
   }

   private getTouches(event: TouchEvent): { primaryTouch: Touch, secondaryTouch: Touch } {

      if (this.primaryTouchId < 0 || this.secondaryTouchId < 0) {
         throw Error('Two touches expected');
      }

      return {
         primaryTouch: this.getTouch(event, this.primaryTouchId),
         secondaryTouch: this.getTouch(event, this.secondaryTouchId),
      }
   }

   private computeTouchDistance(event: TouchEvent): number {

      let touches = this.getTouches(event);

      let x1 = touches.primaryTouch.screenX;
      let y1 = touches.primaryTouch.screenY;
      let x2 = touches.secondaryTouch.screenX;
      let y2 = touches.secondaryTouch.screenY;

      return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
   }

   private computeTouchAngle(event: TouchEvent): number {

      let touches = this.getTouches(event);

      let x1 = touches.primaryTouch.screenX;
      let y1 = touches.primaryTouch.screenY;
      let x2 = touches.secondaryTouch.screenX;
      let y2 = touches.secondaryTouch.screenY;

      return Math.atan2(y2 - y1, x2 - x1);
   }

   private computeTouchCenter(event: TouchEvent): Vec2 {

      let touches = this.getTouches(event);

      let x1 = touches.primaryTouch.screenX;
      let y1 = touches.primaryTouch.screenY;
      let x2 = touches.secondaryTouch.screenX;
      let y2 = touches.secondaryTouch.screenY;

      return new Vec2([(x1 + x2) / 2, (y1 + y2) / 2]);
   }

   private ourOnDown(pos: Vec2) {

      // check for a click handler
      if (this.onClick && this.onClick(pos.clone())) {
         return;
      }
      // if not handled by a click hander, send the onDown event
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

   private ourOnDrag(pos: Vec2) {
      if (this.onDrag) {
         let delta = new Vec2([pos.x - this.lastPos.x, pos.y - this.lastPos.y]);
         this.onDrag(pos.clone(), delta);
      }
      this.lastPos = pos.clone();
   }

   private ourDblClick(pos: Vec2) {
      if (this.onDblClick) {
         this.onDblClick(pos);
      }
   }

   private ourOnScale(scale: number, change: number) {
      if (this.onScale) {
         this.onScale(scale, change);
      }
   }

   private ourOnRotate(angle: number, delta: number) {
      if (this.onRotate) {
         this.onRotate(angle, delta);
      }
   }

   private ourOnTranslate(delta: Vec2) {
      if (this.onTranslate) {
         this.onTranslate(delta);
      }
   }
}