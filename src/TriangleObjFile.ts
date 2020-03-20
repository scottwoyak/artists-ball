import { glVec3 } from "./glVec";
import { IndexedTriangle } from "./IndexedTriangle";
import { TriangleObj } from "./TriangleObj";
import { Profiler } from "./Profiler";

/**
 * Class that loads a .obj file and creates triangles for it
 */
export class TriangleObjFile extends TriangleObj {

   /**
    * Loads a file and creates triangles for it
    * 
    * @param url The file to load
    * @param size The desired max width/height/depth of the scaled object
    * @returns a promise object
    */
   create(url: string): Promise<void> {

      return fetch(url)
         .then(res => res.text())
         .then(res => {
            this.createTriangles(res);
         });
   }

   private createTriangles(src: string) {

      this.parse(src);
   }

   private parseFace(line: string): { iV: number[], iN: number[] } {
      let ret = {
         iV: [] as number[],
         iN: [] as number[],
      }
      let tokens = line.match(/\S+/g);
      let numVals = tokens.length - 1;
      for (let i = 0; i < numVals; i++) {
         let vals = tokens[i + 1].split('/');
         ret.iV.push(parseInt(vals[0]) - 1);
         ret.iN.push(vals.length === 3 ? parseInt(vals[2]) - 1 : -1);
      }
      return ret;
   }

   private parse(src: string) {
      let p = new Profiler();
      let lines = src.split('\n');
      p.log('split');

      for (let i = 0; i < lines.length; i++) {
         let line = lines[i];
         if (line.startsWith('v ')) {
            let tokens = line.match(/\S+/g);
            let vec = new glVec3([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])])
            this.vertices.push(vec);
         }
         else if (line.startsWith('vn ')) {
            let tokens = line.match(/\S+/g);
            let vec = new glVec3([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])])
            this.normals.push(vec);
         }
         else if (line.startsWith('f ')) {
            let ret = this.parseFace(line);
            if (ret.iN.length === 4) {
               this.push(new IndexedTriangle(this.vertices, ret.iV[0], ret.iV[1], ret.iV[2], this.normals, ret.iN[0], ret.iN[1], ret.iN[2]));
               this.push(new IndexedTriangle(this.vertices, ret.iV[0], ret.iV[2], ret.iV[3], this.normals, ret.iN[0], ret.iN[2], ret.iN[3]));
            }
            else {
               this.push(new IndexedTriangle(this.vertices, ret.iV[0], ret.iV[1], ret.iV[2], this.normals, ret.iN[0], ret.iN[1], ret.iN[2]));
            }
         }
      }

      console.log('Vertices: ' + this.vertices.length);
      console.log('Triangles: ' + this.triangles.length);
      p.log('parse');
   }
}