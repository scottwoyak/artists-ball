import { Triangle } from "./Triangle";
import { glVec3 } from "./glVec";
import { glColor } from "./glColor";
import { TriangleObj } from "./TriangleObj";

export class TriangleCube extends TriangleObj {

   public constructor() {
      super();
   }

   create(size: number, center: glVec3): Promise<void> {
      super.store(this.createTriangles(size, center));
      return Promise.resolve();
   }

   createFace(triangles: Triangle[], p1: glVec3, p2: glVec3, p3: glVec3, p4: glVec3) {
      triangles.push(new Triangle(p1, p2, p3));
      triangles.push(new Triangle(p2, p3, p4));
   }

   createTriangles(size: number, center: glVec3): Triangle[] {

      let p1 = new glVec3([center.x - size / 2, center.y - size / 2, center.z - size / 2]);
      let p2 = new glVec3([center.x - size / 2, center.y - size / 2, center.z + size / 2]);
      let p3 = new glVec3([center.x - size / 2, center.y + size / 2, center.z - size / 2]);
      let p4 = new glVec3([center.x - size / 2, center.y + size / 2, center.z + size / 2]);
      let p5 = new glVec3([center.x + size / 2, center.y - size / 2, center.z - size / 2]);
      let p6 = new glVec3([center.x + size / 2, center.y - size / 2, center.z + size / 2]);
      let p7 = new glVec3([center.x + size / 2, center.y + size / 2, center.z - size / 2]);
      let p8 = new glVec3([center.x + size / 2, center.y + size / 2, center.z + size / 2]);

      let triangles: Triangle[] = [];
      this.createFace(triangles, p1, p2, p3, p4);
      this.createFace(triangles, p5, p6, p7, p8);

      this.createFace(triangles, p1, p2, p5, p6);
      this.createFace(triangles, p3, p4, p7, p8);

      this.createFace(triangles, p1, p3, p5, p7);
      this.createFace(triangles, p2, p4, p6, p8);

      return triangles;
   }
}