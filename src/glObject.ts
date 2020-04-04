import { TriangleObj, NormalType } from "./TriangleObj";
import { glAttributeBuffer } from "./glAttributeBuffer";
import { Mat4 } from "./Mat";
import { Vec3 } from "./Vec";
import { glUniform } from "./glUniform";
import { Profiler } from "./Profiler";
import { glIndexBuffer } from "./glIndexBuffer";

export class glObject {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   public readonly tObj: TriangleObj;
   private program: WebGLProgram;
   private vertexBuffer: glAttributeBuffer;
   private normalBuffer: glAttributeBuffer;
   private indexBuffer: glIndexBuffer;
   private model = new Mat4();

   public get name(): string {
      return this.tObj.name;
   }

   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      tObj: TriangleObj,
      program: WebGLProgram
   ) {

      this.gl = glCtx;
      let gl = this.gl;

      var ext = gl.getExtension('OES_element_index_uint');

      this.tObj = tObj;
      this.program = program;

      // create buffers (and associated attributes)
      this.vertexBuffer = new glAttributeBuffer(gl, program, 'aVertex');
      this.normalBuffer = new glAttributeBuffer(gl, program, 'aNormal');
      this.indexBuffer = new glIndexBuffer(gl);

      this.uploadTriangles();
   }

   public delete() {
      this.vertexBuffer.delete();
      this.normalBuffer.delete();
      this.indexBuffer.delete();
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
   public translate(offset: Vec3) {
      this.model.translate(offset);
   }
   public clearTransforms() {
      this.model = new Mat4();
   }

   public uploadTriangles() {

      this.vertexBuffer.upload(this.tObj.vertices);
      this.normalBuffer.upload(this.tObj.normals);
      this.indexBuffer.upload(this.tObj.indices);
   }

   public draw() {

      let gl = this.gl;
      let uni = new glUniform(gl, this.program);
      uni.set('model', this.model.transpose());

      this.vertexBuffer.bind();
      this.indexBuffer.bind();
      this.normalBuffer.bind();

      gl.drawElements(gl.TRIANGLES, 3 * this.tObj.numTriangles, gl.UNSIGNED_INT, 0);
   }

   public optimize(normalType: NormalType) {
      this.tObj.optimize(normalType);
      this.uploadTriangles();
   }
}