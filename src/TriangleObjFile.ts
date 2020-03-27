import { glVec3 } from "./glVec";
import { IndexedTriangle } from "./IndexedTriangle";
import { TriangleObj, NormalType } from "./TriangleObj";
import { Profiler } from "./Profiler";

export type StatusFunction = (status: string) => void;

/**
 * Class that loads a .obj file and creates triangles for it
 */
export class TriangleObjFile extends TriangleObj {

   private updateStatus: StatusFunction;

   public constructor(src: string, statusFunction?: StatusFunction) {

      super();

      // record the status function. If one is not supplied, create one that does nothing
      if (statusFunction) {
         this.updateStatus = statusFunction;
      }
      else {
         this.updateStatus = (status) => { };
      }

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

      this.updateStatus('Processing');
      let t = Date.now();

      let p = new Profiler();
      let lines = src.split('\n');
      p.log('split');

      for (let i = 0; i < lines.length; i++) {
         // report progress every 50 ms
         if (Date.now() - t > 50) {
            this.updateStatus('Processing: ' + (100 * i / lines.length).toFixed() + '%');
            t = Date.now();
         }
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
      if (this.normals.length === 0) {
         this.computeNormals(NormalType.Smooth);
      }
      this.updateStatus('Processing: 100%');

      console.log('Vertices: ' + this.vertices.length);
      console.log('Normals: ' + this.normals.length);
      console.log('Triangles: ' + this.triangles.length);
      p.log('parse');
   }
}