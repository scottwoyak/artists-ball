import { Volume } from './Volume';
import { TriangleObj } from '../../Util3D/TriangleObj';
import { Vec3 } from '../../Util3D/Vec';
import { IndexedVec3 } from '../../Util3D/IndexedVec3';
import { clamp } from '../../Util/Globals';

/**
 * Wrapper for TriangleObj used by the PathTracer app. Adds the ability to 
 * move vertices (as opposed to using a tranformation matrix) and to break
 * things down into volumes.
 */
export class PathTracerObj {
   public volumes: Volume[] = [];
   public tObj: TriangleObj;

   public constructor(tObj: TriangleObj) {
      this.tObj = tObj;

      this.autoCenter();
      this.breakIntoVolumes();
   }

   /**
    * Scales the object, centers it, and puts it on the floor at y=0
    */
   private autoCenter() {

      const center = this.tObj.box.center;
      const trans = new Vec3([-center.x, -center.y + this.tObj.height / 2, -center.z]);

      const scale = 2 / this.tObj.diagonal;

      for (let i = 0; i < this.tObj.numVertices; i++) {
         const v = new IndexedVec3(this.tObj.vertices, i);

         v.x = (v.x + trans.x) * scale;
         v.y = (v.y + trans.y) * scale;
         v.z = (v.z + trans.z) * scale;
      }

      this.tObj.box.min.x = (this.tObj.box.min.x + trans.x) * scale;
      this.tObj.box.min.y = (this.tObj.box.min.y + trans.y) * scale;
      this.tObj.box.min.z = (this.tObj.box.min.z + trans.z) * scale;
      this.tObj.box.max.x = (this.tObj.box.max.x + trans.x) * scale;
      this.tObj.box.max.y = (this.tObj.box.max.y + trans.y) * scale;
      this.tObj.box.max.z = (this.tObj.box.max.z + trans.z) * scale;

      for (let i = 0; i < this.volumes.length; i++) {
         const v = this.volumes[i];
         v.boxMin.x = (v.boxMin.x + trans.x) * scale;
         v.boxMin.y = (v.boxMin.y + trans.y) * scale;
         v.boxMin.z = (v.boxMin.z + trans.z) * scale;
         v.boxMax.x = (v.boxMax.x + trans.x) * scale;
         v.boxMax.y = (v.boxMax.y + trans.y) * scale;
         v.boxMax.z = (v.boxMax.z + trans.z) * scale;
      }
   }

   /**
    * Breaks the object into evenly spaced volumes. The number of volumes is automatically
    * determined based on the number of triangles.
    */
   public breakIntoVolumes() {
      let numSteps;
      if (this.tObj.numTriangles < 40) {
         numSteps = 1;
      } else if (this.tObj.numTriangles < 1500) {
         numSteps = 2;
      }
      else {
         numSteps = 3;
      }
      this.volumes = [];
      for (let i = 0; i < Math.pow(numSteps, 3); i++) {
         this.volumes.push(new Volume());
      }

      for (let i = 0; i < this.tObj.numTriangles; i++) {
         const t = this.tObj.getTriangle(i);
         let x = Math.floor(numSteps * (t.minX - this.tObj.box.min.x) / (this.tObj.box.width));
         let y = Math.floor(numSteps * (t.minY - this.tObj.box.min.y) / (this.tObj.box.height));
         let z = Math.floor(numSteps * (t.minZ - this.tObj.box.min.z) / (this.tObj.box.depth));
         x = clamp(x, 0, numSteps - 1);
         y = clamp(y, 0, numSteps - 1);
         z = clamp(z, 0, numSteps - 1);
         const index = x + y * numSteps + z * numSteps * numSteps;
         this.volumes[index].push(t);
      }
   }
}