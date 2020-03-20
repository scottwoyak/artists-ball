import { TriangleObj, NormalType } from "./TriangleObj";
import { glBuffer } from "./glBuffer";
import { glMat4 } from "./glMat";
import { glVec3 } from "./glVec";
import { gl } from "./Globals";
import { glUniform } from "./glUniform";

export class glObject {
   private tObj: TriangleObj;
   private program: WebGLProgram;
   private vertexBuffer: glBuffer;
   private normalBuffer: glBuffer;
   private model = new glMat4();
   private vertices: number[] = [];
   private normals: number[] = [];

   public constructor(tObj: TriangleObj, program: WebGLProgram) {

      this.tObj = tObj;
      this.program = program;

      // create buffers (and associated attributes)
      this.vertexBuffer = new glBuffer(program, 'aVertex');
      this.normalBuffer = new glBuffer(program, 'aNormal');

      this.uploadTriangles();
   }

   public rotX(angle: number) {
      this.model.rotX(angle);
   }
   public rotY(angle: number) {
      this.model.rotY(angle);
   }
   public rotZ(angle: number) {
      this.model.rotZ(angle);
   }
   public scale(scale: number) {
      this.model.scale(scale);
   }
   public translate(offset: glVec3) {
      this.model.translate(offset);
   }
   public clearTransforms() {
      this.model = new glMat4();
   }


   private pushVec(array: number[], vec: glVec3) {
      array.push(vec.x);
      array.push(vec.y);
      array.push(vec.z);
   }

   public uploadTriangles() {

      // convert the triangles into arrays that can be uploaded
      this.vertices = [];
      this.normals = [];
      for (let i = 0; i < this.tObj.triangles.length; i++) {
         let tri = this.tObj.triangles[i];
         this.pushVec(this.vertices, tri.v0);
         this.pushVec(this.vertices, tri.v1);
         this.pushVec(this.vertices, tri.v2);

         this.pushVec(this.normals, tri.n0);
         this.pushVec(this.normals, tri.n1);
         this.pushVec(this.normals, tri.n2);
      }

      this.vertexBuffer.upload(this.vertices);
      this.normalBuffer.upload(this.normals);
   }

   public draw() {

      let uni = new glUniform(this.program);
      uni.set('model', this.model.transpose());

      this.vertexBuffer.bind();
      this.normalBuffer.bind();
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
   }

   public optimize(normalType: NormalType) {
      this.tObj.optimize(normalType);
      this.uploadTriangles();
   }
}