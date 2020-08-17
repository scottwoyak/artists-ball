import { TriangleObj, NormalType } from './TriangleObj';
import { StatusFunction } from '../Util/Globals';
import { Profiler } from '../Util/Profiler';

/**
 * Class that loads a .obj file and creates triangles for it
 */
export class TriangleObjFile extends TriangleObj {

   public constructor(name: string, src: string, updateStatus?: StatusFunction) {

      super(name);

      // record the status function. If one is not supplied, create one that does nothing
      if (!updateStatus) {
         updateStatus = (status) => { return; };
      }

      this.parse(src, updateStatus);
   }

   private parseFace(line: string): { iV: number[], iN: number[] } {
      const ret = {
         iV: [] as number[],
         iN: [] as number[],
      }
      const tokens = line.match(/\S+/g);
      const numVals = tokens.length - 1;
      for (let i = 0; i < numVals; i++) {
         const vals = tokens[i + 1].split('/');
         ret.iV.push(parseInt(vals[0]) - 1);
         if (vals.length === 3) {
            ret.iN.push(parseInt(vals[2]) - 1);
         }
      }
      return ret;
   }

   private parse(src: string, updateStatus: StatusFunction) {

      updateStatus('Processing');
      let t = Date.now();

      const p2 = new Profiler();
      const p = new Profiler();
      const lines = src.split('\n');
      p.log('split');

      const vertices: number[] = [];
      const normals: number[] = [];
      const vIndices: number[] = [];
      const nIndices: number[] = [];
      let match = true;
      let containsNormals = true;

      for (let i = 0; i < lines.length; i++) {
         // report progress every 50 ms
         if (Date.now() - t > 50) {
            updateStatus('Processing: ' + (100 * i / lines.length).toFixed() + '%');
            t = Date.now();
         }
         const line = lines[i];
         if (line.startsWith('v ')) {
            const tokens = line.match(/\S+/g);
            vertices.push(parseFloat(tokens[1]));
            vertices.push(parseFloat(tokens[2]));
            vertices.push(parseFloat(tokens[3]));
         }
         else if (line.startsWith('vn ')) {
            const tokens = line.match(/\S+/g);
            normals.push(parseFloat(tokens[1]));
            normals.push(parseFloat(tokens[2]));
            normals.push(parseFloat(tokens[3]));
         }
         else if (line.startsWith('f ')) {
            const ret = this.parseFace(line);

            if (containsNormals) {
               if (ret.iV.length !== ret.iN.length) {
                  containsNormals = false;
                  console.warn('Normals not specified in file. Flat normals will be computed.');
               }
               else if (match) {
                  for (let i = 0; i < ret.iV.length; i++) {
                     if (ret.iV[i] != ret.iN[i]) {
                        console.warn('Vertices and normals don\'t match. Content will be re-indexed');
                        match = false;
                        break;
                     }
                  }
               }
            }

            if (ret.iV.length === 4) {

               vIndices.push(ret.iV[0], ret.iV[1], ret.iV[2]);
               vIndices.push(ret.iV[0], ret.iV[2], ret.iV[3]);
               if (containsNormals) {
                  nIndices.push(ret.iN[0], ret.iN[1], ret.iN[2]);
                  nIndices.push(ret.iN[0], ret.iN[2], ret.iN[3]);
               }
            }
            else {
               vIndices.push(ret.iV[0], ret.iV[1], ret.iV[2]);
               if (containsNormals) {
                  nIndices.push(ret.iN[0], ret.iN[1], ret.iN[2]);
               }
            }
         }
      }

      p.log('parse');

      if (match) {
         this.vertices = vertices;
         this.indices = vIndices;

         if (containsNormals) {
            this.normals = normals;
         }
      }
      else {
         this.vertices = [];
         this.normals = [];
         this.indices = [];

         for (let i = 0; i < vIndices.length; i++) {
            this.vertices.push(vertices[3 * vIndices[i] + 0]);
            this.vertices.push(vertices[3 * vIndices[i] + 1]);
            this.vertices.push(vertices[3 * vIndices[i] + 2]);
            this.normals.push(normals[3 * nIndices[i] + 0]);
            this.normals.push(normals[3 * nIndices[i] + 1]);
            this.normals.push(normals[3 * nIndices[i] + 2]);
            this.indices.push(i);
         }
         p.log('reindex');
      }

      if (containsNormals === false) {
         this.computeNormals(NormalType.Flat);
         p.log('compute normals');
      }

      this.findBounds();
      p.log('findBounds');
      p2.log('Total');

      updateStatus('Processing: 100%');

      console.log('Vertices: ' + this.vertices.length);
      console.log('Normals: ' + this.normals.length);
      console.log('Triangles: ' + this.numTriangles);
   }
}