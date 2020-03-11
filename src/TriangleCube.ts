import { Triangle } from "./Triangle";
import { glVec3 } from "./glVec";
import { glColor } from "./glColor";
import { TriangleObject } from "./TriangleBase";

export class TriangleCube extends TriangleObject {

   public constructor() {
      super();
   }

   create(size: number, center: glVec3): Promise<void> {
      super.store(this.createTriangles(size, center));
      return Promise.resolve();
   }

   createFace(triangles: Triangle[], p1: glVec3, p2: glVec3, p3: glVec3, p4: glVec3) {
      let c1 = new glColor([0.5, 0.8, 0.5]);
      let c2 = new glColor([0.8, 0.3, 0.3]);
      triangles.push(new Triangle(p1, p2, p3, c1));
      triangles.push(new Triangle(p2, p3, p4, c2));
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