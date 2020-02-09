import { glVec3 } from "./glVec";
import { Uniforms } from "./Shaders";
import { PathTracer } from "./PathTracer";
import { glMat4 } from "./glMat";
import { zoomZ, angleY, angleX, canvas } from "./index";

export class App {
   public tracer = new PathTracer();
   private modelview: glMat4;
   private projection: glMat4;
   private modelviewProjection: glMat4;
   private start: number;
   private count = 0;

   constructor() {
      this.start = new Date().getTime();
      requestAnimationFrame(() => this.tick());
   }

   /**
    * Processes a click/touch event at the designated coordinates. If a hit
    * occurs, the clicked on view is swapped for the primary view and true
    * is returned. If no hit occurs, false is returned.
    * 
    * @param x The x coordinate.
    * @param y The y coordinate.
    * @returns true if a hit on one of the views occurs.
    */
   public click(x: number, y: number): boolean {
      let size = canvas.width / 4;

      if (y < size) {
         if (x > canvas.width - size) {
            this.swap(1);
            return true;
         }
         else if (x > canvas.width - 2 * size) {
            this.swap(0);
            return true;
         }
      }

      return false;
   }

   public updateTexture(timeSinceStart: number) {
      this.modelview = glMat4.makeLookAt(
         Uniforms.uEye,
         new glVec3([0, 0, 0]),  // center point
         new glVec3([0, 1, 0])   // up vector
      );

      this.projection = glMat4.makePerspective(55, 1, 0.1, 100);
      this.modelviewProjection = this.projection.multM(this.modelview);
      this.tracer.updateTexture(this.modelviewProjection, timeSinceStart);
   };

   public displayTexture(): void {
      this.tracer.displayTexture();
   };

   public restart(): void {
      this.count = 0;
      this.tracer.restart();
   }

   public swap(pos: number) {
      this.tracer.swap(pos);
   }

   public tick() {

      this.count++;
      let timeSinceStart = ((new Date()).getTime() - this.start) * 0.001;

      if (this.count < 150) {
         Uniforms.uEye.set(0, zoomZ * Math.sin(angleY) * Math.cos(angleX));
         Uniforms.uEye.set(1, zoomZ * Math.sin(angleX));
         Uniforms.uEye.set(2, zoomZ * Math.cos(angleY) * Math.cos(angleX));

         this.updateTexture(timeSinceStart);
         this.displayTexture();
      }

      requestAnimationFrame(() => this.tick());
   }



}

