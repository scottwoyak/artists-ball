import { Matrix } from "./Matrix";
import { makeLookAt } from './glUtils';
import { makePerspective } from './glUtils';
import { Renderer } from "./Renderer";
import { Uniforms } from "./Uniforms";

////////////////////////////////////////////////////////////////////////////////
// class UI
////////////////////////////////////////////////////////////////////////////////

export class UI {
   public renderer = new Renderer();
   private modelview: Matrix;
   private projection: Matrix;
   private modelviewProjection: Matrix;

   public update(timeSinceStart: number) {
      this.modelview = makeLookAt(
         Uniforms.eye.elements[0],
         Uniforms.eye.elements[1],
         Uniforms.eye.elements[2],
         0, 0, 0, 0, 1, 0
      );
      this.projection = makePerspective(55, 1, 0.1, 100);
      this.modelviewProjection = this.projection.x(this.modelview);
      this.renderer.update(this.modelviewProjection, timeSinceStart);
   };

   public render(): void {
      this.renderer.render();
   };

};

////////////////////////////////////////////////////////////////////////////////
// main program
////////////////////////////////////////////////////////////////////////////////


