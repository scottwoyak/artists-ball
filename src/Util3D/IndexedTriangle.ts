import { IndexedVec3 } from "./IndexedVec3";
import { Vec3 } from "./Vec";

/**
 * Minimalist wrapper around a WebGL triangle element
 */
export class IndexedTriangle {
   public v1: IndexedVec3;
   public v2: IndexedVec3;
   public v3: IndexedVec3;
   public n1: IndexedVec3;
   public n2: IndexedVec3;
   public n3: IndexedVec3;
   public i1: number;
   public i2: number;
   public i3: number;

   constructor(
      vertices: number[],
      normals: number[],
      i1: number,
      i2: number,
      i3: number,
   ) {
      this.v1 = new IndexedVec3(vertices, i1);
      this.v2 = new IndexedVec3(vertices, i2);
      this.v3 = new IndexedVec3(vertices, i3);
      this.n1 = new IndexedVec3(normals, i1);
      this.n2 = new IndexedVec3(normals, i2);
      this.n3 = new IndexedVec3(normals, i3);
      this.i1 = i1;
      this.i2 = i2;
      this.i3 = i3;
   }

   get minX(): number {
      return Math.min(this.v1.x, this.v2.x, this.v3.x);
   }
   get minY(): number {
      return Math.min(this.v1.y, this.v2.y, this.v3.y);
   }
   get minZ(): number {
      return Math.min(this.v1.z, this.v2.z, this.v3.z);
   }

   get maxX(): number {
      return Math.max(this.v1.x, this.v2.x, this.v3.x);
   }
   get maxY(): number {
      return Math.max(this.v1.y, this.v2.y, this.v3.y);
   }
   get maxZ(): number {
      return Math.max(this.v1.z, this.v2.z, this.v3.z);
   }

   public computeNormal(): Vec3 {
      let v1 = this.v1.toVec3();
      let v2 = this.v2.toVec3();
      let v3 = this.v3.toVec3();

      let a = v2.subtract(v1);
      let b = v3.subtract(v2);
      return a.cross(b).normalize();
   }
}
