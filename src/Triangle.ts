import { glVec3 } from "./glVec";

/**
 * Class for holding information about a triangle
 */
export class Triangle {
   p0: glVec3;
   p1: glVec3;
   p2: glVec3;

   constructor(p0: glVec3, p1: glVec3, p2: glVec3) {
      this.p0 = p0;
      this.p1 = p1;
      this.p2 = p2;
   }

   get minX(): number {
      return Math.min(this.p0.x, Math.min(this.p1.x, this.p2.x));
   }

   get minY(): number {
      return Math.min(this.p0.y, Math.min(this.p1.y, this.p2.y));
   }

   get minZ(): number {
      return Math.min(this.p0.z, Math.min(this.p1.z, this.p2.z));
   }

   get maxX(): number {
      return Math.max(this.p0.x, Math.max(this.p1.x, this.p2.x));
   }

   get maxY(): number {
      return Math.max(this.p0.y, Math.max(this.p1.y, this.p2.y));
   }

   get maxZ(): number {
      return Math.max(this.p0.z, Math.max(this.p1.z, this.p2.z));
   }
}
