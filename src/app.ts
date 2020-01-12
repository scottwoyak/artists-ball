import { glVec3 } from "./glVec";
import { Uniforms } from "./Shaders";
import { PathTracer } from "./PathTracer";
import { glMat4 } from "./glMat";

export class App {
   public tracer = new PathTracer();
   private modelview: glMat4;
   private projection: glMat4;
   private modelviewProjection: glMat4;

   constructor() {
   }

   public update(timeSinceStart: number) {
      this.modelview = glMat4.makeLookAt(
         Uniforms.eye,
         new glVec3([0, 0, 0]),  // center point
         new glVec3([0, 1, 0])   // up vector
      );

      this.projection = glMat4.makePerspective(55, 1, 0.1, 100);
      this.modelviewProjection = this.projection.multM(this.modelview);
      this.tracer.update(this.modelviewProjection, timeSinceStart);
   };

   public render(): void {
      this.tracer.render();
   };

   public restart(): void {
      this.tracer.restart();
   }

}

