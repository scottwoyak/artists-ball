import { makeLookAt } from './glUtils';
import { makePerspective } from './glUtils';
import { Renderer } from "./Renderer";
import { Uniforms } from "./Uniforms";
import { glMat4 } from "./glMat";

////////////////////////////////////////////////////////////////////////////////
// class UI
////////////////////////////////////////////////////////////////////////////////

export class UI {
   public renderer = new Renderer();
   private modelview: glMat4;
   private projection: glMat4;
   private modelviewProjection: glMat4;

   public update(timeSinceStart: number) {
      this.modelview = makeLookAt(
         Uniforms.eye.get(0),
         Uniforms.eye.get(1),
         Uniforms.eye.get(2),
         0, 0, 0, 0, 1, 0
      );
      this.projection = makePerspective(55, 1, 0.1, 100);
      this.modelviewProjection = this.projection.multM(this.modelview);
      this.renderer.update(this.modelviewProjection, timeSinceStart);
   };

   public render(): void {
      this.renderer.render();
   };

};

////////////////////////////////////////////////////////////////////////////////
// main program
////////////////////////////////////////////////////////////////////////////////


