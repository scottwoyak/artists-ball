import { Vec2 } from '../Util3D/Vec';

type PointerRotateFunction = (angle: number, delta: number) => void;
type PointerTranslateFunction = (delta: Vec2) => void;
type PointerScaleFunction = (scale: number, change: number) => void;
type PointerDragFunction = (pos: Vec2, delta: Vec2) => void;
type PointerMoveFunction = (pos: Vec2, delta: Vec2) => void;
type PointerUpFunction = (pos: Vec2) => void;
type PointerDownFunction = (pos: Vec2) => void;
type PointerDblClickFunction = (pos: Vec2) => boolean;
type PointerClickFunction = (pos: Vec2) => boolean;

const DBL_CLICK_TIME = 300; // ms

/**
 * Utility class for managing touch/mouse events over a html element
 */
export class PointerEventHandler {

   private element: HTMLElement;
   private mouseDown = false;

   public onUp: PointerUpFunction | null = null;
   public onDown: PointerDownFunction | null = null;
   public onScale: PointerScaleFunction | null = null;
   public onRotate: PointerRotateFunction | null = null;
   public onTranslate: PointerTranslateFunction | null = null;
   public onClick: PointerClickFunction | null = null;
   public onDblClick: PointerDblClickFunction | null = null;
   public onDrag: PointerDragFunction | null = null;
   public onMove: PointerMoveFunction | null = null;
   public ctrlKey = false;

   public lastPos = new Vec2([0, 0]);
   private lastTouchTime = Date.now();
   private primaryTouchId: number | null = null;
   private secondaryTouchId: number | null = null;
   private initialTouchDistance = -1;
   private lastTouchDistance = -1;
   private lastTouchAngle = -1;
   private lastTouchCenter = new Vec2([-1, -1]);

   public constructor(element: HTMLElement) {

      this.element = element;

      this.element.addEventListener('touchstart', this.touchstart);
      this.element.addEventListener('mousedown', this.mousedown);
      window.addEventListener('mousemove', this.mousemove);
      this.element.addEventListener('dblclick', this.dblclick);
      this.element.addEventListener('wheel', this.onWheel);
   }

   public dispose(): void {
      this.element.removeEventListener('touchstart', this.touchstart);
      this.element.removeEventListener('mousedown', this.mousedown);
      window.removeEventListener('mousemove', this.mousemove);
      this.element.removeEventListener('dblclick', this.dblclick);
      this.element.removeEventListener('wheel', this.onWheel);
   }

   private dblclick = (event: MouseEvent) => {

      this.ctrlKey = event.ctrlKey;

      const pos = this.getPos(event);
      this.ourDblClick(pos);
   };

   private mousedown = (event: MouseEvent) => {

      this.ctrlKey = event.ctrlKey;

      // if this value is set, it means another handler already did something
      // with the event and we should not continue to process it.
      //
      // Some use cases:
      //   1) Levels Panel. Dragging the panel should move it around unless the
      //      user clicks on one of the items to drag it within the panel
      //   2) Menus closing. When clicking outside of a menu, the menu should close
      //
      if (event.defaultPrevented) {
         return;
      }

      if (event.target instanceof HTMLInputElement === false &&
         event.target instanceof HTMLButtonElement === false) {

         const pos = this.getPos(event);
         this.ourOnDown(pos);

         window.addEventListener('mouseup', this.mouseup);

         // disable selection because we're doing something else with dragging
         event.preventDefault();
      }
   };

   private mousemove = (event: MouseEvent) => {

      this.ctrlKey = event.ctrlKey;

      const pos = this.getPos(event);
      if (this.mouseDown) {
         this.ourOnDrag(pos);
         this.lastPos = this.getPos(event);
      }
      else {
         this.ourOnMove(pos);
         this.lastPos = this.getPos(event);
      }
   };

   private mouseup = (event: MouseEvent) => {

      this.ctrlKey = event.ctrlKey;

      this.ourOnUp(this.getPos(event));

      window.removeEventListener('mouseup', this.mouseup);
   };

   private touchstart = (event: TouchEvent) => {

      this.ctrlKey = event.ctrlKey;

      // see mousedown for comments
      if (event.defaultPrevented) {
         return;
      }

      if (event.target instanceof HTMLInputElement === false &&
         event.target instanceof HTMLButtonElement === false) {

         // prevent the browser from using the event
         event.preventDefault();

         // if this is the first touch
         if (event.touches.length === 1) {

            // record the primary touch id
            this.primaryTouchId = event.touches[0].identifier;

            // send out onDown() and potentially onDblClick() events
            const pos = this.getPos(event.touches[0]);

            const time = Date.now();
            if (time - this.lastTouchTime < DBL_CLICK_TIME) {
               this.ourDblClick(pos);
            }
            else {
               this.element.addEventListener('touchmove', this.touchmove);
               this.element.addEventListener('touchend', this.touchend);

               this.ourOnDown(pos);
            }
            this.lastTouchTime = time;
         }
         // if this is the second touch
         else if (event.touches.length === 2 && this.primaryTouchId !== null) {

            // record the secondary touch id. It will always be the second element when
            // there are only two elements
            this.secondaryTouchId = event.touches[1].identifier;

            // set values for gestures
            const distance = this.computeTouchDistance(event);
            this.initialTouchDistance = distance;
            this.lastTouchDistance = distance;
            this.lastTouchAngle = this.computeTouchAngle(event);
            this.lastTouchCenter = this.computeTouchCenter(event);
         }
      }
   };

   private touchmove = (event: TouchEvent) => {

      this.ctrlKey = event.ctrlKey;

      // prevent the browser from using the event
      event.preventDefault();

      // if the initial two touches are active
      if (this.primaryTouchId !== null && this.secondaryTouchId !== null) {

         // send out gesture events
         const distance = this.computeTouchDistance(event);
         const scale = distance / this.initialTouchDistance;
         const change = distance / this.lastTouchDistance;
         this.ourOnScale(scale, change);
         this.lastTouchDistance = distance;

         const angle = this.computeTouchAngle(event);
         this.ourOnRotate(angle, angle - this.lastTouchAngle);
         this.lastTouchAngle = angle;

         const center = this.computeTouchCenter(event);
         // reverse Y values so the bottom is zero instead of the top
         const delta = [center.x - this.lastTouchCenter.x, this.lastTouchCenter.y - center.y];
         this.ourOnTranslate(new Vec2(delta));
         this.lastTouchCenter = center;
      }
      // if only the initial touch is active
      else if (this.primaryTouchId !== null) {

         // send out the drag event
         if (this.mouseDown) {
            const touch = this.getTouch(event, this.primaryTouchId);

            if (touch === null) {
               throw new Error('Internal Error: touch=null');
            }

            const pos = this.getPos(touch);
            this.ourOnDrag(pos);
            this.lastPos = this.getPos(touch);
         }
      }
   };

   private touchend = (event: TouchEvent) => {

      this.ctrlKey = event.ctrlKey;

      // prevent the browser from using the event
      // needed to select an input element
      //event.preventDefault();

      if (this.secondaryTouchId !== null) {
         if (this.getTouch(event, this.secondaryTouchId) === null) {
            this.secondaryTouchId = null;

            // if we lifted the second finger, but not the first, go back
            // to the drag gesture, but adjust the rememberd position to
            // be the current one so that things don't jump
            const touch = this.getTouch(event, this.primaryTouchId);
            if (touch) {
               this.lastPos = this.getPos(touch);
            }
         }
      }

      if (this.primaryTouchId !== null) {
         if (this.getTouch(event, this.primaryTouchId) === null) {
            this.primaryTouchId = null;

            this.ourOnUp(this.lastPos);
         }
      }

      if (this.secondaryTouchId === null || this.primaryTouchId === null) {
         this.initialTouchDistance = -1;
         this.lastTouchDistance = -1;
         this.lastTouchAngle = -1;
         this.lastTouchCenter = new Vec2([-1, -1]);
      }

      if (this.secondaryTouchId === null && this.primaryTouchId === null) {
         this.element.removeEventListener('touchmove', this.touchmove);
         this.element.removeEventListener('touchend', this.touchend);
      }
   };

   private getTouch(event: TouchEvent, id: number): Touch | null {

      for (let i = 0; i < event.touches.length; i++) {
         const touch = event.touches[i];
         if (touch.identifier === id) {
            return touch;
         }
      }

      // no match was found
      return null;
   }

   private getPos(touchOrEvent: Touch | MouseEvent): Vec2 {
      const rect = this.element.getBoundingClientRect();
      return new Vec2([touchOrEvent.clientX - rect.x, touchOrEvent.clientY - rect.y]);
   }

   private getTouches(event: TouchEvent): { primaryTouch: Touch | null, secondaryTouch: Touch | null } {

      if (this.primaryTouchId === null || this.secondaryTouchId === null) {
         throw Error('Two touches expected');
      }

      return {
         primaryTouch: this.getTouch(event, this.primaryTouchId),
         secondaryTouch: this.getTouch(event, this.secondaryTouchId),
      }
   }

   private computeTouchDistance(event: TouchEvent): number {

      const touches = this.getTouches(event);

      if (touches.primaryTouch === null) {
         throw new Error('Internal Error: computeTouchDistance() primaryTouch=null');
      }
      if (touches.secondaryTouch === null) {
         throw new Error('Internal Error: computeTouchDistance() secondaryTouch=null');
      }

      const x1 = touches.primaryTouch.screenX;
      const y1 = touches.primaryTouch.screenY;
      const x2 = touches.secondaryTouch.screenX;
      const y2 = touches.secondaryTouch.screenY;

      return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
   }

   private computeTouchAngle(event: TouchEvent): number {

      const touches = this.getTouches(event);

      if (touches.primaryTouch === null) {
         throw new Error('Internal Error: computeTouchAngle() primaryTouch=null');
      }
      if (touches.secondaryTouch === null) {
         throw new Error('Internal Error: computeTouchAngle() secondaryTouch=null');
      }

      const x1 = touches.primaryTouch.screenX;
      const y1 = touches.primaryTouch.screenY;
      const x2 = touches.secondaryTouch.screenX;
      const y2 = touches.secondaryTouch.screenY;

      return Math.atan2(y2 - y1, x2 - x1);
   }

   private computeTouchCenter(event: TouchEvent): Vec2 {

      const touches = this.getTouches(event);
      if (touches.primaryTouch === null) {
         throw new Error('Internal Error: computeTouchCenter() primaryTouch=null');
      }
      if (touches.secondaryTouch === null) {
         throw new Error('Internal Error: computeTouchCenter() secondaryTouch=null');
      }

      const x1 = touches.primaryTouch.screenX;
      const y1 = touches.primaryTouch.screenY;
      const x2 = touches.secondaryTouch.screenX;
      const y2 = touches.secondaryTouch.screenY;

      return new Vec2([(x1 + x2) / 2, (y1 + y2) / 2]);
   }

   private onWheel = (event: WheelEvent) => {
      if (event.deltaY > 0) {
         this.ourOnScale(1, 1.03);
      }
      else {
         this.ourOnScale(1, 0.97);
      }
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

   private ourOnUp(pos: Vec2) {

      this.mouseDown = false;

      if (this.onUp) {
         this.onUp(pos.clone());
      }
   }

   private ourOnDrag(pos: Vec2) {
      if (this.onDrag) {
         const delta = new Vec2([pos.x - this.lastPos.x, pos.y - this.lastPos.y]);
         this.onDrag(pos.clone(), delta);
      }
   }

   private ourOnMove(pos: Vec2) {
      if (this.onMove) {
         const delta = new Vec2([pos.x - this.lastPos.x, pos.y - this.lastPos.y]);
         this.onMove(pos.clone(), delta);
      }
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