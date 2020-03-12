import { glVec3 } from "./glVec";
import { glUniformBlock } from "./glUniformBlock";
import { IndexedTriangle } from "./IndexedTriangle";

/**
 * Class that loads a .obj file and creates triangles for it
 */
export class TriangleObjFile {

   private vertices: glVec3[] = [];
   private triangles: IndexedTriangle[] = [];
   private boxMin: glVec3;
   private boxMax: glVec3;

   /**
    * Loads a file and creates triangles for it
    * 
    * @param url The file to load
    * @param size The desired max width/height/depth of the scaled object
    * @param center The center point for the object
    * @returns a promise object
    */
   create(url: string, size: number, center: glVec3): Promise<void> {

      return fetch(url)
         .then(res => res.text())
         .then(res => {
            this.createTriangles(res, size, center);
         });
   }

   private createTriangles(src: string, size: number, center: glVec3) {

      this.parse(src);
      this.autoAdjust(size, center);

      console.log('Num Triangles: ' + this.triangles.length);

      //this.dumpObjContent();
   }

   private storeTriangle(i1: number, i2: number, i3: number) {

      let t = new IndexedTriangle(this.vertices, i1, i2, i3);
      //if (t.minY > -0.8 && t.minY < 1.0 && t.minZ < -0.5) {
      this.triangles.push(t);
      //}
   }

   private parse(src: string) {
      let lines = src.split('\n');

      for (let i = 0; i < lines.length; i++) {
         let line = lines[i];
         if (line.startsWith('v ')) {
            let tokens = line.split(' ');
            let vec = new glVec3([parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3])])
            this.vertices.push(vec);
         }
         else if (line.startsWith('f ')) {
            let tokens = line.split(' ');
            if (tokens.length === 5) {
               let i1 = parseInt(tokens[1].split('/')[0]) - 1;
               let i2 = parseInt(tokens[2].split('/')[0]) - 1;
               let i3 = parseInt(tokens[3].split('/')[0]) - 1;
               let i4 = parseInt(tokens[4].split('/')[0]) - 1;
               this.storeTriangle(i1, i2, i3);
               this.storeTriangle(i1, i3, i4);
            }
            else {
               let i1 = parseInt(tokens[1].split('/')[0]) - 1;
               let i2 = parseInt(tokens[2].split('/')[0]) - 1;
               let i3 = parseInt(tokens[3].split('/')[0]) - 1;
               this.storeTriangle(i1, i2, i3);
            }
         }
      }

      //      this.triangles = this.triangles.splice(0, 511);
      this.boxMin = new glVec3([Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]);
      this.boxMax = new glVec3([-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE]);
      for (let i = 0; i < this.triangles.length; i++) {
         let tri = this.triangles[i];
         this.boxMin.x = Math.min(this.boxMin.x, tri.minX);
         this.boxMin.y = Math.min(this.boxMin.y, tri.minY);
         this.boxMin.z = Math.min(this.boxMin.z, tri.minZ);
         this.boxMax.x = Math.max(this.boxMax.x, tri.maxX);
         this.boxMax.y = Math.max(this.boxMax.y, tri.maxY);
         this.boxMax.z = Math.max(this.boxMax.z, tri.maxZ);
      }
   }

   private autoAdjust(size: number, center: glVec3) {
      let trans = new glVec3([
         -(this.boxMax.x + this.boxMin.x) / 2,
         -(this.boxMax.y + this.boxMin.y) / 2,
         -(this.boxMax.z + this.boxMin.z) / 2,
      ]);

      let scale = size / Math.max(this.boxMax.x - this.boxMin.x, Math.max(this.boxMax.y - this.boxMin.y, this.boxMax.z - this.boxMin.z));

      for (let i = 0; i < this.vertices.length; i++) {
         let v = this.vertices[i];

         v.x = (v.x + trans.x) * scale + center.x;
         v.y = (v.y + trans.y) * scale + center.y;
         v.z = (v.z + trans.z) * scale + center.z;
      }

      this.boxMin.x = (this.boxMin.x + trans.x) * scale + center.x;
      this.boxMin.y = (this.boxMin.y + trans.y) * scale + center.y;
      this.boxMin.z = (this.boxMin.z + trans.z) * scale + center.z;
      this.boxMax.x = (this.boxMax.x + trans.x) * scale + center.x;
      this.boxMax.y = (this.boxMax.y + trans.y) * scale + center.y;
      this.boxMax.z = (this.boxMax.z + trans.z) * scale + center.z;
   }

   private dumpObjContent() {
      let str = "";
      for (let i = 0; i < this.vertices.length; i++) {
         let v = this.vertices[i];
         str += 'v ' + v.x + ' ' + v.y + ' ' + v.z + '\n';
      }
      for (let i = 0; i < this.triangles.length; i++) {
         let t = this.triangles[i];
         str += 'f ' + (t.i0 + 1) + ' ' + (t.i1 + 1) + ' ' + (t.i2 + 1) + '\n';
      }
      console.log(str);
   }

   public get code(): string {
      let code = "";
      let numTriangles = this.triangles.length;
      code += 'const int NUM_TRIANGLES = ' + numTriangles + ';\n';
      code += '\n';
      if (numTriangles == 0) {
         code += 'Triangle triangles[1];\n';
         code += '\n';
      }
      else {
         code += 'layout (std140) uniform MyVerticesBlock\n';
         code += '{\n';
         code += '   vec3 vertices[' + this.vertices.length + '];\n';
         code += '};\n';
         code += '\n';

         code += 'struct ITriangle\n';
         code += '{\n'
         code += '   int i0;\n'
         code += '   int i1;\n'
         code += '   int i2;\n'
         code += '};\n';
         code += '\n';

         code += 'layout (std140) uniform MyTrianglesBlock\n';
         code += '{\n';
         code += '   ITriangle triangles[' + numTriangles + '];\n';
         code += '};\n';
      }
      code += 'vec3 boxMin = vec3(' + this.boxMin.x + ', ' + this.boxMin.y + ', ' + this.boxMin.z + ');\n';
      code += 'vec3 boxMax = vec3(' + this.boxMax.x + ', ' + this.boxMax.y + ', ' + this.boxMax.z + ');\n';
      code += '\n';

      code += 'Triangle getTriangle(int index)\n';
      code += '{\n';
      code += '   ITriangle tri = triangles[index];\n';
      code += '   vec3 p0 = vertices[tri.i0];\n';
      code += '   vec3 p1 = vertices[tri.i1];\n';
      code += '   vec3 p2 = vertices[tri.i2];\n';
      code += '   return Triangle(p0, p1, p2);\n';
      code += '}\n';

      console.log(code);
      return code;
   }

   public uploadUniformBlock(program: WebGLProgram) {

      let blockBinding = 2;
      let vBlock = new glUniformBlock(program, 'MyVerticesBlock', blockBinding);

      // put the data into a Float32Array for uploading
      let vData = new Float32Array(this.vertices.length * 4);
      for (let i = 0; i < this.vertices.length; i++) {
         let v = this.vertices[i];
         vData[4 * i + 0] = v.x;
         vData[4 * i + 1] = v.y;
         vData[4 * i + 2] = v.z;
         vData[4 * i + 3] = 0;
      }
      vBlock.upload(vData);

      blockBinding = 3;
      let tBlock = new glUniformBlock(program, 'MyTrianglesBlock', blockBinding);

      // put the data into a Float32Array for uploading
      let tData = new Int32Array(this.triangles.length * 4);
      for (let i = 0; i < this.triangles.length; i++) {
         let t = this.triangles[i];
         tData[4 * i + 0] = t.i0;
         tData[4 * i + 1] = t.i1;
         tData[4 * i + 2] = t.i2;
         tData[4 * i + 3] = 0;
      }
      tBlock.upload(tData);
   }
}