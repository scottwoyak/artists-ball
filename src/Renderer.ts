////////////////////////////////////////////////////////////////////////////////
// class Renderer
////////////////////////////////////////////////////////////////////////////////

import { PathTracer } from './PathTracer';
import { glMat4 } from './glMat';
import { glVec3 } from './glVec';

export class Renderer {
   public pathTracer = new PathTracer();

   public update(modelviewProjection: glMat4, timeSinceStart: number) {

      let x = Math.random() * 2 - 1;
      let y = Math.random() * 2 - 1;
      let z = 0;

      let size = 512.0;
      let v = new glVec3([x / size, y / size, z / size]);
      let jitter = glMat4.fromTranslation(v);
      let inverse = jitter.multM(modelviewProjection).invert();

      this.pathTracer.update(inverse, timeSinceStart);
   };

   public render() {
      this.pathTracer.render();
   }
};

