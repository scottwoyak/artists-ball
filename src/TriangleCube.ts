import { glVec3 } from "./glVec";
import { TriangleObj } from "./TriangleObj";
import { IndexedTriangle } from "./IndexedTriangle";
import { Volume } from "./Volume";

export class TriangleCube extends TriangleObj {

   public constructor(size: number, center: glVec3) {

      super('Cube');

      this.createTriangles(size, center);

      this.volumes.push(new Volume());
      this.volumes[0].boxMin = this.boxMin.clone();
      this.volumes[0].boxMax = this.boxMax.clone();
      this.volumes[0].triangles = this.triangles;
   }

   createFace(i1: number, i2: number, i3: number, i4: number) {

      this.push(new IndexedTriangle(this.vertices, i1, i2, i3, this.normals));
      this.push(new IndexedTriangle(this.vertices, i2, i4, i3, this.normals));
   }

   createTriangles(size: number, center: glVec3) {

      this.vertices.push(new glVec3([center.x - size / 2, center.y - size / 2, center.z - size / 2]));
      this.vertices.push(new glVec3([center.x - size / 2, center.y - size / 2, center.z + size / 2]));
      this.vertices.push(new glVec3([center.x - size / 2, center.y + size / 2, center.z - size / 2]));
      this.vertices.push(new glVec3([center.x - size / 2, center.y + size / 2, center.z + size / 2]));
      this.vertices.push(new glVec3([center.x + size / 2, center.y - size / 2, center.z - size / 2]));
      this.vertices.push(new glVec3([center.x + size / 2, center.y - size / 2, center.z + size / 2]));
      this.vertices.push(new glVec3([center.x + size / 2, center.y + size / 2, center.z - size / 2]));
      this.vertices.push(new glVec3([center.x + size / 2, center.y + size / 2, center.z + size / 2]));

      this.createFace(0, 1, 2, 3);
      this.createFace(4, 6, 5, 7);

      this.createFace(0, 4, 1, 5);
      this.createFace(2, 3, 6, 7);

      this.createFace(0, 2, 4, 6);
      this.createFace(1, 5, 3, 7);
   }
}
