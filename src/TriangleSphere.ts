import { glVec3 } from "./glVec";
import { TriangleObj } from "./TriangleObj";
import { IndexedTriangle } from "./IndexedTriangle";

/**
 * Creates a sphere using triangles
 */
export class TriangleSphere extends TriangleObj {

   /**
    * Creates the sphere
    * 
    * @param numSteps The number of bands used to cover the sphere
    * @param radius The radius of the sphere
    * @param center The center of the sphere
    * @returns A Promise object
    */
   create(numSteps: number, radius: number, center: glVec3): Promise<void> {

      this.createNow(numSteps, radius, center);

      return Promise.resolve();
   }

   public createNow(numSteps: number, radius: number, center: glVec3) {

      // create the vertices
      this.createVertices(numSteps, radius, center);

      // create triangles from the vertices
      this.connectVertices(numSteps);

      // break the sphere into volumes
      this.breakIntoVolumes();

   }

   private createVertices(numSteps: number, radius: number, center: glVec3) {
      for (let i = 0; i < numSteps; i++) {
         if (i === 0) {
            this.vertices.push(new glVec3([center.x, center.y + radius, center.z]));
         }
         else if (i === numSteps - 1) {
            this.vertices.push(new glVec3([center.x, center.y - radius, center.z]));
         }
         else {
            let y = radius * Math.cos(i / (numSteps - 1) * Math.PI);
            let r = radius * Math.sin(i / (numSteps - 1) * Math.PI);
            let offset = i % 2 ? 0 : ((2 * Math.PI) / numSteps) * 0.5;

            for (let j = 0; j < numSteps; j++) {

               this.vertices.push(new glVec3([
                  center.x + r * Math.sin((j / numSteps) * 2 * Math.PI - offset),
                  center.y + y,
                  center.z + r * Math.cos((j / numSteps) * 2 * Math.PI - offset),
               ]));
            }
         }
      }
   }

   private connectVertices(numSteps: number) {
      let first = 0;
      let last = this.vertices.length - 1;
      for (let i = 0; i < numSteps - 1; i++) {
         for (let j = 0; j < numSteps; j++) {
            if (i === 0) {
               let i1 = first;
               let i2 = j + 1;
               let i3 = j === (numSteps - 1) ? 1 : i2 + 1;
               this.push(new IndexedTriangle(this.vertices, i1, i2, i3, this.normals));
            }
            else if (i === numSteps - 2) {
               let startIndex = last - numSteps;
               let i1 = last;
               let i2 = startIndex + j;
               let i3 = j === (numSteps - 1) ? startIndex : i2 + 1;
               this.push(new IndexedTriangle(this.vertices, i1, i3, i2, this.normals));
            }
            else {
               let startA = 1 + (i - 1) * numSteps;
               let startB = 1 + i * numSteps;
               let i1 = startA + j;
               let i2 = (j === (numSteps - 1)) ? startA : i1 + 1;
               let i3 = startB + j;
               let i4 = (j === (numSteps - 1)) ? startB : i3 + 1;
               if (i % 2) {
                  this.push(new IndexedTriangle(this.vertices, i1, i4, i2, this.normals));
                  this.push(new IndexedTriangle(this.vertices, i1, i3, i4, this.normals));
               }
               else {
                  this.push(new IndexedTriangle(this.vertices, i1, i3, i2, this.normals));
                  this.push(new IndexedTriangle(this.vertices, i2, i3, i4, this.normals));
               }
            }
         }
      }
   }
}
