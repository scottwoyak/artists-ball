import { glVec3 } from "./glVec";
import { glUniformBlock } from "./glUniformBlock";
import { IndexedTriangle } from "./IndexedTriangle";
import { gl } from "./app";

const MAX = 1000; // INFINITY in our rendering world

class Volume {
   public triangles: IndexedTriangle[] = [];
   public boxMin = new glVec3([MAX, MAX, MAX]);
   public boxMax = new glVec3([-MAX, -MAX, -MAX]);
   public push(triangle: IndexedTriangle) {

      this.triangles.push(triangle);
      this.boxMin.x = Math.min(this.boxMin.x, triangle.minX);
      this.boxMin.y = Math.min(this.boxMin.y, triangle.minY);
      this.boxMin.z = Math.min(this.boxMin.z, triangle.minZ);
      this.boxMax.x = Math.max(this.boxMax.x, triangle.maxX);
      this.boxMax.y = Math.max(this.boxMax.y, triangle.maxY);
      this.boxMax.z = Math.max(this.boxMax.z, triangle.maxZ);
   }
}

/**
 * Class that loads a .obj file and creates triangles for it
 */
export class TriangleObjFile {

   private vertices: glVec3[] = [];
   private triangles: IndexedTriangle[] = [];
   private boxMin: glVec3;
   private boxMax: glVec3;
   private volumes: Volume[];

   public get width(): number {
      return this.boxMax.x - this.boxMin.x;
   }

   public get height(): number {
      return this.boxMax.y - this.boxMin.y;
   }

   public get depth(): number {
      return this.boxMax.z - this.boxMin.z;
   }

   /**
    * Loads a file and creates triangles for it
    * 
    * @param url The file to load
    * @param size The desired max width/height/depth of the scaled object
    * @returns a promise object
    */
   create(url: string, size: number): Promise<void> {

      return fetch(url)
         .then(res => res.text())
         .then(res => {
            this.createTriangles(res, size);
         });
   }

   private createTriangles(src: string, size: number) {

      this.parse(src);
      this.autoAdjust(size);
      this.breakIntoVolumes();

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

   private autoAdjust(size: number) {
      let trans = new glVec3([
         -(this.boxMax.x + this.boxMin.x) / 2,
         -(this.boxMax.y + this.boxMin.y) / 2,
         -(this.boxMax.z + this.boxMin.z) / 2,
      ]);

      let scale = size / Math.max(this.boxMax.x - this.boxMin.x, Math.max(this.boxMax.y - this.boxMin.y, this.boxMax.z - this.boxMin.z));

      for (let i = 0; i < this.vertices.length; i++) {
         let v = this.vertices[i];

         v.x = (v.x + trans.x) * scale;
         v.y = (v.y + trans.y) * scale;
         v.z = (v.z + trans.z) * scale;
      }

      this.boxMin.x = (this.boxMin.x + trans.x) * scale;
      this.boxMin.y = (this.boxMin.y + trans.y) * scale;
      this.boxMin.z = (this.boxMin.z + trans.z) * scale;
      this.boxMax.x = (this.boxMax.x + trans.x) * scale;
      this.boxMax.y = (this.boxMax.y + trans.y) * scale;
      this.boxMax.z = (this.boxMax.z + trans.z) * scale;
   }

   public translate(offset: glVec3) {

      for (let i = 0; i < this.vertices.length; i++) {
         let v = this.vertices[i];

         v.x += offset.x;
         v.y += offset.y;
         v.z += offset.z;
      }

      this.boxMin.x += offset.x;
      this.boxMin.y += offset.y;
      this.boxMin.z += offset.z;
      this.boxMax.x += offset.x;
      this.boxMax.y += offset.y;
      this.boxMax.z += offset.z;

      for (let i = 0; i < this.volumes.length; i++) {
         let vol = this.volumes[i];
         vol.boxMin.x += offset.x;
         vol.boxMin.y += offset.y;
         vol.boxMin.z += offset.z;
         vol.boxMax.x += offset.x;
         vol.boxMax.y += offset.y;
         vol.boxMax.z += offset.z;
      }
   }

   private clamp(val: number, min: number, max: number): number {
      val = Math.min(val, max);
      val = Math.max(val, min);
      return val;
   }

   private breakIntoVolumes() {
      this.volumes = [];
      let numSteps = this.triangles.length > 1500 ? 3 : 2;
      for (let i = 0; i < Math.pow(numSteps, 3); i++) {
         this.volumes.push(new Volume);
      }

      for (let i = 0; i < this.triangles.length; i++) {
         let t = this.triangles[i];
         let x = Math.floor(numSteps * (t.minX - this.boxMin.x) / (this.boxMax.x - this.boxMin.x));
         let y = Math.floor(numSteps * (t.minY - this.boxMin.y) / (this.boxMax.y - this.boxMin.y));
         let z = Math.floor(numSteps * (t.minZ - this.boxMin.z) / (this.boxMax.z - this.boxMin.z));
         x = this.clamp(x, 0, numSteps - 1);
         y = this.clamp(y, 0, numSteps - 1);
         z = this.clamp(z, 0, numSteps - 1);
         let index = x + y * numSteps + z * numSteps * numSteps;
         this.volumes[index].push(t);
      }

      for (let i = 0; i < this.volumes.length; i++) {
         let vol = this.volumes[i];
         console.log('vol[' + i + '] min=' + vol.boxMin.toString(1) + ' max=' + vol.boxMax.toString(1));
      }
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
      code += 'const int NUM_VOLUMES = ' + this.volumes.length + ';\n';
      code += 'const int NUM_TRIANGLES = ' + this.triangles.length + ';\n';
      code += '\n';
      if (this.triangles.length == 0) {
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
         code += '   ITriangle triangles[' + this.triangles.length + '];\n';
         code += '};\n';
      }

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

   public uploadUniforms(program: WebGLProgram) {

      // upload the big chunks as Uniform Blocks
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
      let index = 0;
      for (let v = 0; v < this.volumes.length; v++) {
         let vol = this.volumes[v];
         for (let i = 0; i < vol.triangles.length; i++) {
            let t = vol.triangles[i];
            tData[index++] = t.i0;
            tData[index++] = t.i1;
            tData[index++] = t.i2;
            tData[index++] = 0;
         }
      }
      tBlock.upload(tData);

      // Upload the volume info as a standard uniform
      gl.useProgram(program);
      let startIndex = 0;
      let loc;
      for (let i = 0; i < this.volumes.length; i++) {
         let vol = this.volumes[i];
         loc = gl.getUniformLocation(program, 'object.volumes[' + i + '].startIndex');
         gl.uniform1i(loc, startIndex);
         loc = gl.getUniformLocation(program, 'object.volumes[' + i + '].numTriangles');
         gl.uniform1i(loc, vol.triangles.length);
         loc = gl.getUniformLocation(program, 'object.volumes[' + i + '].boxMin');
         gl.uniform3fv(loc, new Float32Array(vol.boxMin.values));
         loc = gl.getUniformLocation(program, 'object.volumes[' + i + '].boxMax');
         gl.uniform3fv(loc, new Float32Array(vol.boxMax.values));
         startIndex += vol.triangles.length;
      }
      loc = gl.getUniformLocation(program, 'object.boxMin');
      gl.uniform3fv(loc, new Float32Array(this.boxMin.values));
      loc = gl.getUniformLocation(program, 'object.boxMax');
      gl.uniform3fv(loc, new Float32Array(this.boxMax.values));
   }


}