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
      super.breakIntoVolumes();
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
         else if (line.startsWith('f ')) {
            let tokens = line.match(/\S+/g);
            if (tokens.length === 5) {
               let i1 = parseInt(tokens[1].split('/')[0]) - 1;
               let i2 = parseInt(tokens[2].split('/')[0]) - 1;
               let i3 = parseInt(tokens[3].split('/')[0]) - 1;
               let i4 = parseInt(tokens[4].split('/')[0]) - 1;
               this.push(new IndexedTriangle(this.vertices, i1, i2, i3));
               this.push(new IndexedTriangle(this.vertices, i1, i3, i4));
            }
            else {
               let i1 = parseInt(tokens[1].split('/')[0]) - 1;
               let i2 = parseInt(tokens[2].split('/')[0]) - 1;
               let i3 = parseInt(tokens[3].split('/')[0]) - 1;
               this.push(new IndexedTriangle(this.vertices, i1, i2, i3));
            }
         }
      }
      p.log('parse');
   }
}