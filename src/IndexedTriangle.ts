import { glVec3 } from "./glVec";

/**
 * Class for holding information about a triangle
 */
export class IndexedTriangle {
   vertices: glVec3[];
   public iV0: number;
   public iV1: number;
   public iV2: number;

   normals: glVec3[];
   public iN0: number;
   public iN1: number;
   public iN2: number;

   constructor(
      vertices: glVec3[], iV0: number, iV1: number, iV2: number,
      normals: glVec3[], iN0?: number, iN1?: number, iN2?: number,
   ) {
      this.vertices = vertices;
      this.iV0 = iV0;
      this.iV1 = iV1;
      this.iV2 = iV2;

      this.normals = normals;
      if (iN0 === undefined || iN0 === -1) {
         let normal = this.computeNormal();
         this.normals.push(normal);
         let index = this.normals.length - 1;
         this.iN0 = index;
         this.iN1 = index;
         this.iN2 = index;
      }
      else {
         this.normals = normals;
         this.iN0 = iN0;
         this.iN1 = iN1;
         this.iN2 = iN2;

         /*
         let n = this.computeNormal();
         let n0 = this.n0;
         let n1 = this.n1;
         let n2 = this.n2;
         console.log(n.toString(2));
         console.log(n0.toString(2));
         console.log(n1.toString(2));
         console.log(n2.toString(2));
         */
      }
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

   get n0(): glVec3 {
      return this.normals[this.iN0];
   }
   get n1(): glVec3 {
      return this.normals[this.iN1];
   }
   get n2(): glVec3 {
      return this.normals[this.iN2];
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

   public computeNormal(): glVec3 {
      let a = this.v1.subtract(this.v0);
      let b = this.v2.subtract(this.v1);
      return a.cross(b).normalize();
   }
}
