import { glVec3 } from "./glVec";
import { Uniforms } from "./Shaders";
import { PathTracer } from "./PathTracer";
import { glMat4 } from "./glMat";
import { zoomZ, angleY, angleX } from "./index";

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

