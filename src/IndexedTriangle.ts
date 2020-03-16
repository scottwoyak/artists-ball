import { glVec3 } from "./glVec";

/**
 * Class for holding information about a triangle
 */
export class IndexedTriangle {
   vertices: glVec3[];
   i0: number;
   i1: number;
   i2: number;

   constructor(vertices: glVec3[], i0: number, i1: number, i2: number) {
      this.vertices = vertices;
      this.i0 = i0;
      this.i1 = i1;
      this.i2 = i2;
   }

   get p0(): glVec3 {
      return this.vertices[this.i0];
   }

   get p1(): glVec3 {
      return this.vertices[this.i1];
   }

   get p2(): glVec3 {
      return this.vertices[this.i2];
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

   get normal(): glVec3 {
      let a = this.p1.clone().subtract(this.p0);
      let b = this.p2.clone().subtract(this.p1);
      return a.cross(b).normalize();
   }
}
