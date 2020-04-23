import { TriangleObj, NormalType } from "./TriangleObj";
import { glAttributeBuffer } from "./glAttributeBuffer";
import { Vec3, Vec4 } from "./Vec";
import { glUniform } from "./glUniform";
import { glIndexBuffer } from "./glIndexBuffer";
import { Mat4 } from "./Mat";
import { BoundingBox } from "./BoundingBox";

export class glObject {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   public readonly tObj: TriangleObj;
   private program: WebGLProgram;
   private vertexBuffer: glAttributeBuffer;
   private normalBuffer: glAttributeBuffer;
   private indexBuffer: glIndexBuffer;

   // this matrix normals the object so that all object are centered
   // about the origin with diagonal length of 2 units
   public normalize = Mat4.identity;

   // this is the standard "model" matrix
   public model = Mat4.identity;

   public get name(): string {
      return this.tObj.name;
   }

   public get box(): BoundingBox {
      return this.tObj.box.multM(this.normalize);
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

   public autoSize(center: Vec3, size: number) {

      let objCenter = this.tObj.center;
      this.normalize = Mat4.identity;
      this.normalize.translate(new Vec3([center.x - objCenter.x, center.y - objCenter.y, center.z - objCenter.z]));
      this.normalize.scale(size / this.tObj.diagonal);
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

   public rotX(angle: number) {
      this.model.rotX(angle);
   }
   public rotY(angle: number) {
      this.model.rotY(angle);
   }
   public rotZ(angle: number) {
      this.model.rotZ(angle);
   }
   public preRotX(angle: number) {
      this.model.preRotX(angle);
   }
   public preRotY(angle: number) {
      this.model.preRotY(angle);
   }
   public preRotZ(angle: number) {
      this.model.preRotZ(angle);
   }
   public scale(scale: number) {
      this.model.scale(scale);
   }
   public translate(offset: Vec3) {
      this.model.translate(offset);
   }
   public clearTransforms() {
      this.model = Mat4.identity;
   }

   public uploadTriangles() {

      this.vertexBuffer.upload(this.tObj.vertices);
      this.normalBuffer.upload(this.tObj.normals);
      this.indexBuffer.upload(this.tObj.indices);
   }

   public draw() {

      let gl = this.gl;
      let uni = new glUniform(gl, this.program);
      uni.set('normalize', this.normalize);
      uni.set('model', this.model);

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

      let xForm = this.model.multM(this.normalize);
      for (let i = 0; i < vecs.length / 3; i++) {
         vec.x = vecs[3 * i + 0];
         vec.y = vecs[3 * i + 1];
         vec.z = vecs[3 * i + 2];
         vec = xForm.multV(vec);

         if (normals) {
            vec = vec.normalize();
         }

         vecs[3 * i + 0] = vec.x;
         vecs[3 * i + 1] = vec.y;
         vecs[3 * i + 2] = vec.z;
      }
   }

   public applyXForm() {
      this.applyToVecs(false);
      this.applyToVecs(true);

      this.normalize = Mat4.identity;
      this.model = Mat4.identity;
      this.tObj.findBounds();
      this.rebuildBuffers();
   }
}