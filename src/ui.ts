import { glMat4 } from "./glMat";
import { PathTracer } from './PathTracer';
import { Uniforms } from './Shaders';
import { glVec3 } from "./glVec";

////////////////////////////////////////////////////////////////////////////////
// class UI
////////////////////////////////////////////////////////////////////////////////

export class UI {
   public tracer = new PathTracer();
   private modelview: glMat4;
   private projection: glMat4;
   private modelviewProjection: glMat4;

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

};

////////////////////////////////////////////////////////////////////////////////
// main program
////////////////////////////////////////////////////////////////////////////////


