import { Triangle } from "./Triangle";
import { glVec3 } from "./glVec";
import { glColor } from "./glColor";

export class TriangleSphere {
   public triangles: Triangle[] = [];
   public boxMin: glVec3;
   public boxMax: glVec3;

   constructor(numSteps: number, radius: number, center: glVec3) {

      let offset = 0;
      let c1 = new glColor([0.5, 0.8, 0.5]);
      let c2 = new glColor([0.8, 0.3, 0.3]);
      for (let i = 0; i < numSteps; i++) {
         let yA = radius * (center.y - Math.cos(i / numSteps * Math.PI));
         let yB = radius * (center.y - Math.cos((i + 1) / numSteps * Math.PI));

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
               this.triangles.push(new Triangle(p1, p2, p3, c1));
            }
            if (i < numSteps - 1) {
               this.triangles.push(new Triangle(p3, p2, p4, c2));
            }
         }
         offset += 0.5;

      }

      const MAX = 1000; // INFINITY in our rendering world

      let minX = MAX;
      let minY = MAX;
      let minZ = MAX;
      let maxX = -MAX;
      let maxY = -MAX;
      let maxZ = -MAX;
      for (let i = 0; i < this.triangles.length; i++) {
         minX = Math.min(minX, this.triangles[i].minX);
         minY = Math.min(minY, this.triangles[i].minY);
         minZ = Math.min(minZ, this.triangles[i].minZ);
         maxX = Math.max(maxX, this.triangles[i].maxX);
         maxY = Math.max(maxY, this.triangles[i].maxY);
         maxZ = Math.max(maxZ, this.triangles[i].maxZ);
      }
      this.boxMin = new glVec3([minX, minY, minZ]);
      this.boxMax = new glVec3([maxX, maxY, maxZ]);
   }

   private vecToStr(vec: glVec3): string {
      return 'vec3(' + vec.x + ',' + vec.y + ',' + vec.z + ')';
   }

   private cToStr(c: glColor): string {
      return 'vec3(' + c.r + ',' + c.g + ',' + c.b + ')';
   }

   public get code(): string {
      let code = "";
      let numTriangles = this.triangles.length;
      if (numTriangles == 0) {
         code += 'Triangle triangles[1];\n';
      }
      else {
         code += 'Triangle triangles[' + numTriangles + '] = Triangle[' + numTriangles + '](\n ';

         for (let i = 0; i < numTriangles; i++) {
            let t = this.triangles[i];
            code += 'Triangle(' + this.vecToStr(t.p0) + ',' + this.vecToStr(t.p1) + ',' + this.vecToStr(t.p2) + ',' + this.cToStr(t.color) + ')';

            if (i < numTriangles - 1) {
               code += ',\n';
            }
         }
         code += '\n);\n';
      }
      code += 'vec3 boxMin = ' + this.vecToStr(this.boxMin) + ';\n';
      code += 'vec3 boxMax = ' + this.vecToStr(this.boxMax) + ';\n';

      console.log(code);
      return code;
   }

   public get code2(): string {
      let numTriangles = this.triangles.length;
      let code = 'Triangle triangles[' + numTriangles + '];\n';

      code += 'bool trianglesInitialized = false;'
      code += 'void initTriangles()\n';
      code += '{\n';
      code += 'if ( trianglesInitialized == false )\n';
      code += '{\n';
      code += '   trianglesInitialized = true;';

      for (let i = 0; i < numTriangles; i++) {
         let t = this.triangles[i];
         code += 'triangles[' + i + ']=Triangle(' + this.vecToStr(t.p0) + ',' + this.vecToStr(t.p1) + ',' + this.vecToStr(t.p2) + ',' + this.cToStr(t.color) + ');';
      }
      code += '}\n';
      code += '}\n';
      code += 'vec3 boxMin = ' + this.vecToStr(this.boxMin) + ';\n';
      code += 'vec3 boxMax = ' + this.vecToStr(this.boxMax) + ';\n';

      //      console.log(code);
      return code;
   }
}