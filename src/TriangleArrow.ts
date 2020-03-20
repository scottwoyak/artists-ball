import { glVec3 } from "./glVec";
import { TriangleObj } from "./TriangleObj";
import { IndexedTriangle } from "./IndexedTriangle";

/**
 * Creates a 3D arrow using triangles
 */
export class TriangleArrow extends TriangleObj {

   /**
    * Creates the sphere
    * 
    * @param numSteps The number of bands used to cover the sphere
    * @param radius The radius of the sphere
    * @param center The center of the sphere
    * @returns A Promise object
    */
   create(): Promise<void> {

      this.createNow();

      return Promise.resolve();
   }

   public createNow() {

      // create the vertices
      this.doCreate();

      // break the sphere into volumes
      this.breakIntoVolumes();

   }

   private doCreate() {
      const NUM_STEPS = 30;
      const TIP = new glVec3([0, 0, 0]);
      const TOTAL_LENGTH = 0.4;
      const ARROW_RADIUS = 0.15;
      const ARROW_LENGTH = 1.5 * ARROW_RADIUS;
      const SHAFT_RADIUS = 0.5 * ARROW_RADIUS;

      // build the arrow head
      this.vertices.push(TIP);
      this.vertices.push(new glVec3([0, ARROW_LENGTH, 0]));
      for (let i = 0; i < NUM_STEPS; i++) {
         let x = ARROW_RADIUS * Math.sin(i / (NUM_STEPS - 1) * 2 * Math.PI);
         let y = ARROW_LENGTH;
         let z = ARROW_RADIUS * Math.cos(i / (NUM_STEPS - 1) * 2 * Math.PI);
         this.vertices.push(new glVec3([x, y, z]));
      }
      let iTip = 0;
      let iBase = 1;
      for (let i = 0; i < NUM_STEPS; i++) {
         let i1 = 2 + i;
         let i2 = (i == NUM_STEPS - 1) ? 0 : i1 + 1;
         this.push(new IndexedTriangle(this.vertices, iTip, i2, i1, this.normals));
         this.push(new IndexedTriangle(this.vertices, iBase, i1, i2, this.normals));
      }

      // build the arrow shaft
      this.vertices.push(new glVec3([0, TOTAL_LENGTH, 0]));
      let iEnd = this.vertices.length - 1;
      for (let i = 0; i < NUM_STEPS; i++) {
         let x = SHAFT_RADIUS * Math.sin(i / (NUM_STEPS - 1) * 2 * Math.PI);
         let y = ARROW_LENGTH;
         let z = SHAFT_RADIUS * Math.cos(i / (NUM_STEPS - 1) * 2 * Math.PI);
         this.vertices.push(new glVec3([x, y, z]));
      }
      for (let i = 0; i < NUM_STEPS; i++) {
         let x = SHAFT_RADIUS * Math.sin(i / (NUM_STEPS - 1) * 2 * Math.PI);
         let y = TOTAL_LENGTH;
         let z = SHAFT_RADIUS * Math.cos(i / (NUM_STEPS - 1) * 2 * Math.PI);
         this.vertices.push(new glVec3([x, y, z]));
      }
      let iStart = iEnd + 1;
      for (let i = 0; i < NUM_STEPS; i++) {
         let i1 = iStart + i;
         let i2 = (i == NUM_STEPS - 1) ? iStart : i1 + 1;
         let i3 = i1 + NUM_STEPS;
         let i4 = i2 + NUM_STEPS;

         this.push(new IndexedTriangle(this.vertices, i1, i2, i3, this.normals));
         this.push(new IndexedTriangle(this.vertices, i4, i3, i2, this.normals));
         this.push(new IndexedTriangle(this.vertices, i3, i4, iEnd, this.normals));
      }
   }
}
