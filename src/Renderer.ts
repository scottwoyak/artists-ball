////////////////////////////////////////////////////////////////////////////////
// class Renderer
////////////////////////////////////////////////////////////////////////////////

import { PathTracer } from './PathTracer';
import { Matrix } from "./Matrix";
import { Vector } from "./Vector";

export class Renderer {
   public pathTracer = new PathTracer();

   public update(modelviewProjection: Matrix, timeSinceStart: number) {
      var jitter = Matrix.Translation(new Vector([Math.random() * 2 - 1, Math.random() * 2 - 1, 0]).multiply(1 / 512));
      var inverse = jitter.x(modelviewProjection).inverse();
      this.pathTracer.update(inverse, timeSinceStart);
   };

   public render() {
      this.pathTracer.render();
   }
};

