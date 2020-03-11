import { Triangle } from "./Triangle";
import { glVec3 } from "./glVec";
import { gl } from "./app";

export class TriangleBase {
   private triangles: Triangle[] = [];
   public boxMin: glVec3;
   public boxMax: glVec3;

   protected constructor() {
   }

   protected store(triangles: Triangle[]) {

      console.log("NumTriangles: " + triangles.length);
      this.triangles = triangles;

      const MAX = 1000; // INFINITY in our rendering world

      let minX = MAX;
      let minY = MAX;
      let minZ = MAX;
      let maxX = -MAX;
      let maxY = -MAX;
      let maxZ = -MAX;
      for (let i = 0; i < this.triangles.length; i++) {
         minX = Math.min(minX, this.triangles[i].minX);
         minY = Math.min(minY, this.triangles[i].minY);
         minZ = Math.min(minZ, this.triangles[i].minZ);
         maxX = Math.max(maxX, this.triangles[i].maxX);
         maxY = Math.max(maxY, this.triangles[i].maxY);
         maxZ = Math.max(maxZ, this.triangles[i].maxZ);
      }
      this.boxMin = new glVec3([minX, minY, minZ]);
      this.boxMax = new glVec3([maxX, maxY, maxZ]);
   }

   public get code(): string {
      let code = "";
      let numTriangles = this.triangles.length;
      code += 'const int NUM_TRIANGLES = ' + numTriangles + ';\n';
      if (numTriangles == 0) {
         code += 'Triangle triangles[1];\n';
      }
      else {
         code += 'layout (std140) uniform MyUniformBlock\n';
         code += '{\n';
         code += '   Triangle triangles[' + numTriangles + '];\n';
         code += '};\n';
      }
      code += 'vec3 boxMin = vec3(' + this.boxMin.x + ', ' + this.boxMin.y + ', ' + this.boxMin.z + ');\n';
      code += 'vec3 boxMax = vec3(' + this.boxMax.x + ', ' + this.boxMax.y + ', ' + this.boxMax.z + ');\n';

      code += 'Triangle getTriangle(int index) { return triangles[index]; }\n';

      return code;
   }

   public uploadUniformBlock(program: WebGLProgram) {

      let gl2 = gl as WebGL2RenderingContext;

      // bind the uniform block
      let uniformBlockLocation = gl2.getUniformBlockIndex(program, 'MyUniformBlock');
      let blockBinding = 2;
      gl2.uniformBlockBinding(program, uniformBlockLocation, blockBinding);

      // put the triangle data into a Float32Array for uploading
      let triangleData = new Float32Array(this.triangles.length * 12);
      for (let i = 0; i < this.triangles.length; i++) {
         let tri = this.triangles[i];
         triangleData[12 * i + 0] = tri.p0.x;
         triangleData[12 * i + 1] = tri.p0.y;
         triangleData[12 * i + 2] = tri.p0.z;
         triangleData[12 * i + 3] = 0;
         triangleData[12 * i + 4] = tri.p1.x;
         triangleData[12 * i + 5] = tri.p1.y;
         triangleData[12 * i + 6] = tri.p1.z;
         triangleData[12 * i + 7] = 0;
         triangleData[12 * i + 8] = tri.p2.x;
         triangleData[12 * i + 9] = tri.p2.y;
         triangleData[12 * i + 10] = tri.p2.z;
         triangleData[12 * i + 11] = 0;
      }

      // create a buffer and upload the data
      var uniformBlockBuffer = gl2.createBuffer();
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, uniformBlockBuffer);
      gl2.bufferData(gl2.UNIFORM_BUFFER, triangleData, gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);
      gl2.bindBufferBase(gl2.UNIFORM_BUFFER, 2, uniformBlockBuffer);
   }
}