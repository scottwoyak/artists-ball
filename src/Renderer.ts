////////////////////////////////////////////////////////////////////////////////
// class Renderer
////////////////////////////////////////////////////////////////////////////////

import { PathTracer } from './PathTracer';
import { jsMat4 } from './jsMat';
import { jsVec3 } from './jsVec';

export class Renderer {
   public pathTracer = new PathTracer();

   public update(modelviewProjection: jsMat4, timeSinceStart: number) {

      let x = Math.random() * 2 - 1;
      let y = Math.random() * 2 - 1;
      let z = 0;

      let size = 512.0;
      let v = new jsVec3([x/size,y/size,z/size]);
      let jitter = jsMat4.fromTranslation(v);
      let inverse = modelviewProjection.multM(jitter).inverse();

      this.pathTracer.update(inverse, timeSinceStart);
   };

   public render() {
      this.pathTracer.render();
   }
};

