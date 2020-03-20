import { glVec3 } from "./glVec";

/**
 * Class for holding information about a triangle
 */
export class IndexedTriangle {
   vertices: glVec3[];
   iV0: number;
   iV1: number;
   iV2: number;

   constructor(vertices: glVec3[], iV0: number, iV1: number, iV2: number) {
      this.vertices = vertices;
      this.iV0 = iV0;
      this.iV1 = iV1;
      this.iV2 = iV2;
   }

   get v0(): glVec3 {
      return this.vertices[this.iV0];
   }

   get v1(): glVec3 {
      return this.vertices[this.iV1];
   }

   get v2(): glVec3 {
      return this.vertices[this.iV2];
   }

   get minX(): number {
      return Math.min(this.v0.x, Math.min(this.v1.x, this.v2.x));
   }

   get minY(): number {
      return Math.min(this.v0.y, Math.min(this.v1.y, this.v2.y));
   }

   get minZ(): number {
      return Math.min(this.v0.z, Math.min(this.v1.z, this.v2.z));
   }

   get maxX(): number {
      return Math.max(this.v0.x, Math.max(this.v1.x, this.v2.x));
   }

   get maxY(): number {
      return Math.max(this.v0.y, Math.max(this.v1.y, this.v2.y));
   }

   get maxZ(): number {
      return Math.max(this.v0.z, Math.max(this.v1.z, this.v2.z));
   }

   get normal(): glVec3 {
      let a = this.v1.subtract(this.v0);
      let b = this.v2.subtract(this.v1);
      return a.cross(b).normalize();
   }
}
