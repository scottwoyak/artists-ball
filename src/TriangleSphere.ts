import { Triangle } from "./Triangle";
import { glVec3 } from "./glVec";
import { glColor } from "./glColor";
import { TriangleObject } from "./TriangleObject";

export class TriangleSphere extends TriangleObject {

   constructor(numSteps: number, radius: number, center: glVec3) {
      super(TriangleSphere.createTriangles(numSteps, radius, center));
   }

   static createTriangles(numSteps: number, radius: number, center: glVec3): Triangle[] {
      let offset = 0;
      let c1 = new glColor([0.5, 0.8, 0.5]);
      let c2 = new glColor([0.8, 0.3, 0.3]);
      let triangles: Triangle[] = [];
      for (let i = 0; i < numSteps; i++) {
         let yA = radius * Math.cos(i / numSteps * Math.PI);
         let yB = radius * Math.cos((i + 1) / numSteps * Math.PI);

         let R1 = radius * Math.sin(i / numSteps * Math.PI);
         let R2 = radius * Math.sin((i + 1) / numSteps * Math.PI);

         for (let j = 0; j < numSteps; j++) {
            let p1 = new glVec3([
               center.x + R1 * Math.sin(((j + offset) / numSteps) * 2 * Math.PI),
               center.y + yA,
               center.z + R1 * Math.cos(((j + offset) / numSteps) * 2 * Math.PI),
            ]);

            let p2 = new glVec3([
               center.x + R2 * Math.sin(((j + 0.5 + offset) / numSteps) * 2 * Math.PI),
               center.y + yB,
               center.z + R2 * Math.cos(((j + 0.5 + offset) / numSteps) * 2 * Math.PI),
            ]);

            let p3 = new glVec3([
               center.x + R1 * Math.sin(((j + 1 + offset) / numSteps) * 2 * Math.PI),
               center.y + yA,
               center.z + R1 * Math.cos(((j + 1 + offset) / numSteps) * 2 * Math.PI),
            ]);

            let p4 = new glVec3([
               center.x + R2 * Math.sin(((j + 1.5 + offset) / numSteps) * 2 * Math.PI),
               center.y + yB,
               center.z + R2 * Math.cos(((j + 1.5 + offset) / numSteps) * 2 * Math.PI),
            ]);

            // for the top and bottom we only need one set of triangles to close the surface
            if (i > 0) {
               triangles.push(new Triangle(p1, p2, p3, c1));
            }
            if (i < numSteps - 1) {
               triangles.push(new Triangle(p3, p2, p4, c2));
            }
         }
         offset += 0.5;

      }

      return triangles;
   }
}