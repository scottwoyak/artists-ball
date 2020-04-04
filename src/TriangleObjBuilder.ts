import { TriangleObj } from "./TriangleObj";
import { Vec3 } from "./Vec";

export class TriangleObjBuilder extends TriangleObj {
   constructor(name?: string) {
      super(name);
   }

   // TODO pass in args for construction
   public addArrow() {
      const NUM_STEPS = 30;
      const TOTAL_LENGTH = 0.4;
      const ARROW_RADIUS = 0.15;
      const ARROW_LENGTH = 1.5 * ARROW_RADIUS;
      const SHAFT_RADIUS = 0.5 * ARROW_RADIUS;
      const TIP = new Vec3([0, 0, 0]);
      const TIP_BASE = new Vec3([0, ARROW_LENGTH, 0]);

      // build the arrow head
      for (let i = 0; i < NUM_STEPS; i++) {
         let x1 = ARROW_RADIUS * Math.sin(i / (NUM_STEPS - 1) * 2 * Math.PI);
         let y1 = ARROW_LENGTH;
         let z1 = ARROW_RADIUS * Math.cos(i / (NUM_STEPS - 1) * 2 * Math.PI);
         let x2 = ARROW_RADIUS * Math.sin((i + 1) / (NUM_STEPS - 1) * 2 * Math.PI);
         let y2 = ARROW_LENGTH;
         let z2 = ARROW_RADIUS * Math.cos((i + 1) / (NUM_STEPS - 1) * 2 * Math.PI);

         let p1 = new Vec3([x1, y1, z1]);
         let p2 = new Vec3([x2, y2, z2]);
         this.pushTriangle(TIP, p1, p2);
         this.pushTriangle(TIP_BASE, p2, p1);
      }

      // build the arrow shaft
      const END = new Vec3([0, TOTAL_LENGTH, 0]);
      for (let i = 0; i < NUM_STEPS; i++) {
         let x1 = SHAFT_RADIUS * Math.sin(i / (NUM_STEPS - 1) * 2 * Math.PI);
         let z1 = SHAFT_RADIUS * Math.cos(i / (NUM_STEPS - 1) * 2 * Math.PI);
         let x2 = SHAFT_RADIUS * Math.sin((i + 1) / (NUM_STEPS - 1) * 2 * Math.PI);
         let z2 = SHAFT_RADIUS * Math.cos((i + 1) / (NUM_STEPS - 1) * 2 * Math.PI);

         let p1 = new Vec3([x1, ARROW_LENGTH, z1]);
         let p2 = new Vec3([x2, ARROW_LENGTH, z2]);
         let p3 = new Vec3([x1, TOTAL_LENGTH, z1]);
         let p4 = new Vec3([x2, TOTAL_LENGTH, z2]);
         this.pushTriangle(p1, p2, p4);
         this.pushTriangle(p1, p4, p3);
         this.pushTriangle(END, p3, p4);
      }
   }

   public addSphere(numSteps: number, radius: number, center: Vec3) {

      // create an array of vertices
      let vertices: Vec3[] = [];
      for (let i = 0; i < numSteps; i++) {
         if (i === 0) {
            vertices.push(new Vec3([center.x, center.y + radius, center.z]));
         }
         else if (i === numSteps - 1) {
            vertices.push(new Vec3([center.x, center.y - radius, center.z]));
         }
         else {
            let y = radius * Math.cos(i / (numSteps - 1) * Math.PI);
            let r = radius * Math.sin(i / (numSteps - 1) * Math.PI);
            let offset = i % 2 ? 0 : ((2 * Math.PI) / numSteps) * 0.5;

            for (let j = 0; j < numSteps; j++) {

               vertices.push(new Vec3([
                  center.x + r * Math.sin((j / numSteps) * 2 * Math.PI - offset),
                  center.y + y,
                  center.z + r * Math.cos((j / numSteps) * 2 * Math.PI - offset),
               ]));
            }
         }
      }

      // connect the vertices
      let first = 0;
      let last = vertices.length - 1;
      for (let i = 0; i < numSteps - 1; i++) {
         for (let j = 0; j < numSteps; j++) {
            if (i === 0) {
               let i1 = first;
               let i2 = j + 1;
               let i3 = j === (numSteps - 1) ? 1 : i2 + 1;
               this.pushTriangle(vertices[i1], vertices[i2], vertices[i3]);
            }
            else if (i === numSteps - 2) {
               let startIndex = last - numSteps;
               let i1 = last;
               let i2 = startIndex + j;
               let i3 = j === (numSteps - 1) ? startIndex : i2 + 1;
               this.pushTriangle(vertices[i1], vertices[i3], vertices[i2]);
            }
            else {
               let startA = 1 + (i - 1) * numSteps;
               let startB = 1 + i * numSteps;
               let i1 = startA + j;
               let i2 = (j === (numSteps - 1)) ? startA : i1 + 1;
               let i3 = startB + j;
               let i4 = (j === (numSteps - 1)) ? startB : i3 + 1;
               if (i % 2) {
                  this.pushTriangle(vertices[i1], vertices[i4], vertices[i2]);
                  this.pushTriangle(vertices[i1], vertices[i3], vertices[i4]);
               }
               else {
                  this.pushTriangle(vertices[i1], vertices[i3], vertices[i2]);
                  this.pushTriangle(vertices[i2], vertices[i3], vertices[i4]);
               }
            }
         }
      }
   }

   createFace(vertices: Vec3[], i1: number, i2: number, i3: number, i4: number) {

      let v1 = vertices[i1];
      let v2 = vertices[i2];
      let v3 = vertices[i3];
      let v4 = vertices[i4];

      this.pushTriangle(v1, v2, v3);
      this.pushTriangle(v2, v4, v3);
   }

   addCube(size: number, center: Vec3) {

      let vertices: Vec3[] = [];
      vertices.push(new Vec3([center.x - size / 2, center.y - size / 2, center.z - size / 2]));
      vertices.push(new Vec3([center.x - size / 2, center.y - size / 2, center.z + size / 2]));
      vertices.push(new Vec3([center.x - size / 2, center.y + size / 2, center.z - size / 2]));
      vertices.push(new Vec3([center.x - size / 2, center.y + size / 2, center.z + size / 2]));
      vertices.push(new Vec3([center.x + size / 2, center.y - size / 2, center.z - size / 2]));
      vertices.push(new Vec3([center.x + size / 2, center.y - size / 2, center.z + size / 2]));
      vertices.push(new Vec3([center.x + size / 2, center.y + size / 2, center.z - size / 2]));
      vertices.push(new Vec3([center.x + size / 2, center.y + size / 2, center.z + size / 2]));

      this.createFace(vertices, 0, 1, 2, 3);
      this.createFace(vertices, 4, 6, 5, 7);

      this.createFace(vertices, 0, 4, 1, 5);
      this.createFace(vertices, 2, 3, 6, 7);

      this.createFace(vertices, 0, 2, 4, 6);
      this.createFace(vertices, 1, 5, 3, 7);

      /*
      this.volumes.push(new Volume());
      this.volumes[0].boxMin = this.boxMin.clone();
      this.volumes[0].boxMax = this.boxMax.clone();
      this.volumes[0].triangles = this.triangles;
      */
   }
}