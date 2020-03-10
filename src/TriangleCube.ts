import { Triangle } from "./Triangle";
import { glVec3 } from "./glVec";
import { glColor } from "./glColor";
import { TriangleObject } from "./TriangleObject";

export class TriangleCube extends TriangleObject {

   constructor(size: number, center: glVec3) {
      super(TriangleCube.createTriangles(size, center));
   }

   static createFace(triangles: Triangle[], p1: glVec3, p2: glVec3, p3: glVec3, p4: glVec3) {
      let c1 = new glColor([0.5, 0.8, 0.5]);
      let c2 = new glColor([0.8, 0.3, 0.3]);
      triangles.push(new Triangle(p1, p2, p3, c1));
      triangles.push(new Triangle(p2, p3, p4, c2));
   }
   static createTriangles(size: number, center: glVec3): Triangle[] {

      let p1 = new glVec3([center.x - size / 2, center.y - size / 2, center.z - size / 2]);
      let p2 = new glVec3([center.x - size / 2, center.y - size / 2, center.z + size / 2]);
      let p3 = new glVec3([center.x - size / 2, center.y + size / 2, center.z - size / 2]);
      let p4 = new glVec3([center.x - size / 2, center.y + size / 2, center.z + size / 2]);
      let p5 = new glVec3([center.x + size / 2, center.y - size / 2, center.z - size / 2]);
      let p6 = new glVec3([center.x + size / 2, center.y - size / 2, center.z + size / 2]);
      let p7 = new glVec3([center.x + size / 2, center.y + size / 2, center.z - size / 2]);
      let p8 = new glVec3([center.x + size / 2, center.y + size / 2, center.z + size / 2]);

      let triangles: Triangle[] = [];
      TriangleCube.createFace(triangles, p1, p2, p3, p4);
      TriangleCube.createFace(triangles, p5, p6, p7, p8);

      TriangleCube.createFace(triangles, p1, p2, p5, p6);
      TriangleCube.createFace(triangles, p3, p4, p7, p8);

      TriangleCube.createFace(triangles, p1, p3, p5, p7);
      TriangleCube.createFace(triangles, p2, p4, p6, p8);

      return triangles;
   }
}