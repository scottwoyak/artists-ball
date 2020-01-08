import { makeLookAt } from './glUtils';
import { makePerspective } from './glUtils';
import { Renderer } from "./Renderer";
import { Uniforms } from "./Uniforms";
import { jsMat4 } from "./jsMat";

////////////////////////////////////////////////////////////////////////////////
// class UI
////////////////////////////////////////////////////////////////////////////////

export class UI {
   public renderer = new Renderer();
   private modelview: jsMat4;
   private projection: jsMat4;
   private modelviewProjection: jsMat4;

   public update(timeSinceStart: number) {
      this.modelview = makeLookAt(
         Uniforms.eye.get(0),
         Uniforms.eye.get(1),
         Uniforms.eye.get(2),
         0, 0, 0, 0, 1, 0
      );
      this.projection = makePerspective(55, 1, 0.1, 100);
//      this.modelviewProjection = this.projection.multM(this.modelview);
      this.modelviewProjection = this.modelview.multM(this.projection);
      this.renderer.update(this.modelviewProjection, timeSinceStart);
   };

   public render(): void {
      this.renderer.render();
   };

};

////////////////////////////////////////////////////////////////////////////////
// main program
////////////////////////////////////////////////////////////////////////////////


