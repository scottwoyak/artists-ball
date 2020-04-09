import { TriangleObj, NormalType } from "./TriangleObj";
import { glAttributeBuffer } from "./glAttributeBuffer";
import { Vec3, Vec4 } from "./Vec";
import { glUniform } from "./glUniform";
import { glIndexBuffer } from "./glIndexBuffer";
import { XForm } from "./XForm";
import { Profiler } from "./Profiler";

export class glObject {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   public readonly tObj: TriangleObj;
   private program: WebGLProgram;
   private vertexBuffer: glAttributeBuffer;
   private normalBuffer: glAttributeBuffer;
   private indexBuffer: glIndexBuffer;
   public xForm = new XForm();

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

      this.createBuffers();
      this.uploadTriangles();
   }

   private createBuffers() {
      let gl = this.gl;

      // create buffers (and associated attributes)
      this.vertexBuffer = new glAttributeBuffer(gl, this.program, 'aVertex');
      this.normalBuffer = new glAttributeBuffer(gl, this.program, 'aNormal');
      this.indexBuffer = new glIndexBuffer(gl);
   }

   public delete() {
      this.vertexBuffer.delete();
      this.normalBuffer.delete();
      this.indexBuffer.delete();
   }

   private rebuildBuffers() {
      this.delete();
      this.createBuffers();
      this.uploadTriangles();
   }

   public snap() {
      this.xForm.snap();
   }

   public rotX(angle: number) {
      this.xForm.rotX(angle);
   }
   public rotY(angle: number) {
      this.xForm.rotY(angle);
   }
   public rotZ(angle: number) {
      this.xForm.rotZ(angle);
   }
   public preRotX(angle: number) {
      this.xForm.preRotX(angle);
   }
   public preRotY(angle: number) {
      this.xForm.preRotY(angle);
   }
   public preRotZ(angle: number) {
      this.xForm.preRotZ(angle);
   }
   public scale(scale: number) {
      this.xForm.scale(scale);
   }
   public translate(offset: Vec3) {
      this.xForm.translate(offset);
   }
   public clearTransforms() {
      this.xForm.reset();
   }

   public uploadTriangles() {

      this.vertexBuffer.upload(this.tObj.vertices);
      this.normalBuffer.upload(this.tObj.normals);
      this.indexBuffer.upload(this.tObj.indices);
   }

   public draw() {

      let gl = this.gl;
      let uni = new glUniform(gl, this.program);
      uni.set('model', this.xForm.get());

      this.vertexBuffer.bind();
      this.indexBuffer.bind();
      this.normalBuffer.bind();

      gl.drawElements(gl.TRIANGLES, 3 * this.tObj.numTriangles, gl.UNSIGNED_INT, 0);
   }

   public optimize(normalType: NormalType) {
      this.tObj.optimize(normalType);
      this.rebuildBuffers();
   }

   private applyToVecs(normals: boolean) {

      let vecs = normals ? this.tObj.normals : this.tObj.vertices;

      // if we're updating normals, ignore translation by setting w=0
      let vec = new Vec4([0, 0, 0, normals ? 0 : 1]);

      for (let i = 0; i < vecs.length / 3; i++) {
         vec.x = vecs[3 * i + 0];
         vec.y = vecs[3 * i + 1];
         vec.z = vecs[3 * i + 2];
         vec = this.xForm.mat.multM(this.xForm.base).multV(vec);

         if (normals) {
            vec = vec.normalize();
         }

         vecs[3 * i + 0] = vec.x;
         vecs[3 * i + 1] = vec.y;
         vecs[3 * i + 2] = vec.z;
      }
   }

   public applyXForm() {
      let p = new Profiler();
      this.applyToVecs(false);
      this.applyToVecs(true);

      this.xForm = new XForm();
      this.tObj.box.log('before: ');
      this.tObj.findBounds();
      this.tObj.box.log('after: ');
      this.rebuildBuffers();
      p.log('applyXForm');
   }
}