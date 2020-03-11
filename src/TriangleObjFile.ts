import { Triangle } from "./Triangle";
import { glVec3 } from "./glVec";
import { glColor } from "./glColor";
import { TriangleObject } from "./TriangleBase";
import { TriangleSphere } from "./TriangleSphere";

export class TriangleObj extends TriangleObject {

   public constructor() {
      super();
   }

   create(url: string, center: glVec3): Promise<void> {

      return fetch(url)
         .then(res => res.text())
         .then(res => {
            let lines = res.split('\n');
            let vertices: glVec3[] = [];
            let triangles: Triangle[] = [];
            let color = new glColor([0.5, 0.5, 0.8]);

            for (let i = 0; i < lines.length; i++) {
               let line = lines[i];
               if (line.startsWith('v ')) {
                  let tokens = line.split(' ');
                  let vec = new glVec3([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])])
                  vertices.push(vec);
               }
               else if (line.startsWith('f ')) {
                  let tokens = line.split(' ');
                  if (tokens.length === 5) {
                     let i1 = parseInt(tokens[1].split('/')[0]) - 1;
                     let i2 = parseInt(tokens[2].split('/')[0]) - 1;
                     let i3 = parseInt(tokens[3].split('/')[0]) - 1;
                     let i4 = parseInt(tokens[4].split('/')[0]) - 1;
                     triangles.push(new Triangle(vertices[i1].clone(), vertices[i2].clone(), vertices[i3].clone(), color));
                     triangles.push(new Triangle(vertices[i1].clone(), vertices[i3].clone(), vertices[i4].clone(), color));
                  }
                  else {
                     let i1 = parseInt(tokens[1].split('/')[0]) - 1;
                     let i2 = parseInt(tokens[2].split('/')[0]) - 1;
                     let i3 = parseInt(tokens[3].split('/')[0]) - 1;
                     triangles.push(new Triangle(vertices[i1], vertices[i2], vertices[i3], color));
                  }
               }
            }

            triangles = triangles.splice(0, 1000);
            let min = new glVec3([Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]);
            let max = new glVec3([-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE]);
            for (let i = 0; i < triangles.length; i++) {
               let tri = triangles[i];
               min.x = Math.min(min.x, tri.minX);
               min.y = Math.min(min.y, tri.minY);
               min.z = Math.min(min.z, tri.minZ);
               max.x = Math.max(max.x, tri.maxX);
               max.y = Math.max(max.y, tri.maxY);
               max.z = Math.max(max.z, tri.maxZ);
            }

            let trans = new glVec3([
               -(max.x + min.x) / 2,
               -(max.y + min.y) / 2,
               -(max.z + min.z) / 2,
            ]);

            let scale = 1 / Math.max(max.x - min.x, Math.max(max.y - min.y, max.z - min.z));

            for (let i = 0; i < triangles.length; i++) {
               let tri = triangles[i];

               tri.p0.x = (tri.p0.x + trans.x) * scale + center.x;
               tri.p0.y = (tri.p0.y + trans.y) * scale + center.y;
               tri.p0.z = (tri.p0.z + trans.z) * scale + center.z;

               tri.p1.x = (tri.p1.x + trans.x) * scale + center.x;
               tri.p1.y = (tri.p1.y + trans.y) * scale + center.y;
               tri.p1.z = (tri.p1.z + trans.z) * scale + center.z;

               tri.p2.x = (tri.p2.x + trans.x) * scale + center.x;
               tri.p2.y = (tri.p2.y + trans.y) * scale + center.y;
               tri.p2.z = (tri.p2.z + trans.z) * scale + center.z;
            }

            super.store(triangles);
         });
   }
}