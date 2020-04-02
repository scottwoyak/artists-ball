import { TriangleObj, NormalType } from "./TriangleObj";
import { glBuffer } from "./glBuffer";
import { glMat4 } from "./glMat";
import { glVec3 } from "./glVec";
import { glUniform } from "./glUniform";
import { Profiler } from "./Profiler";

export class glObject {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   public readonly tObj: TriangleObj;
   private program: WebGLProgram;
   private vertexBuffer: glBuffer;
   private normalBuffer: glBuffer;
   private model = new glMat4();

   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      tObj: TriangleObj,
      program: WebGLProgram
   ) {

      this.gl = glCtx;
      let gl = this.gl;

      this.tObj = tObj;
      this.program = program;

      // create buffers (and associated attributes)
      this.vertexBuffer = new glBuffer(gl, program, 'aVertex');
      this.normalBuffer = new glBuffer(gl, program, 'aNormal');

      this.uploadTriangles();
   }

   public delete() {
      this.vertexBuffer.delete();
      this.normalBuffer.delete();
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

      let p = new Profiler();
      // convert the triangles into arrays that can be uploaded
      let vertices: number[] = [];
      let normals: number[] = [];
      for (let i = 0; i < this.tObj.triangles.length; i++) {
         let tri = this.tObj.triangles[i];
         this.pushVec(vertices, tri.v0);
         this.pushVec(vertices, tri.v1);
         this.pushVec(vertices, tri.v2);

         this.pushVec(normals, tri.n0);
         this.pushVec(normals, tri.n1);
         this.pushVec(normals, tri.n2);
      }
      p.log('to glVec[]');

      this.vertexBuffer.upload(vertices);
      this.normalBuffer.upload(normals);
      p.log('upload');
   }

   public draw() {

      let gl = this.gl;
      let uni = new glUniform(gl, this.program);
      uni.set('model', this.model.transpose());

      this.vertexBuffer.bind();
      this.normalBuffer.bind();
      gl.drawArrays(gl.TRIANGLES, 0, this.tObj.triangles.length * 3);
   }

   public optimize(normalType: NormalType) {
      this.tObj.optimize(normalType);
      this.uploadTriangles();
   }
}