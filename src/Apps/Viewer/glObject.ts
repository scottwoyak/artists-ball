import { TriangleObj, NormalType } from '../../Util3D/TriangleObj';
import { glAttributeBuffer } from '../../gl/glAttributeBuffer';
import { glIndexBuffer } from '../../gl/glIndexBuffer';
import { Mat4 } from '../../Util3D/Mat';
import { BoundingBox } from '../../Util3D/BoundingBox';
import { Vec3, Vec4 } from '../../Util3D/Vec';
import { glUniform } from '../../gl/glUniform';

export class glObject {
   private gl: WebGLRenderingContext | WebGL2RenderingContext;
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

   /*
   public getBoundingPts(): BoundingPts {
      //return this.tObj.getBoundingPts();
      let pts = this.tObj.getBoundingPts();
      let p = new Profiler();
      //let bp = pts.multM(this.normalize.multM(this.model));
      //let bp = pts.multM(this.model.multM(this.normalize));
      let bp = pts.multM(this.normalize).multM(this.model);
      //p.log('mult');
      return bp;
   }
   */

   public getBoundingBox(): BoundingBox {
      return this.tObj.box.multM(this.normalize);
   }

   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      tObj: TriangleObj,
      program: WebGLProgram
   ) {

      this.gl = glCtx;
      const gl = this.gl;

      const ext = gl.getExtension('OES_element_index_uint');

      this.tObj = tObj;
      this.program = program;

      this.createBuffers();
      this.uploadTriangles();
   }

   public autoSize(center: Vec3, size: number): void {

      const objCenter = this.tObj.center;
      this.normalize = Mat4.identity;
      this.normalize.translate(new Vec3([center.x - objCenter.x, center.y - objCenter.y, center.z - objCenter.z]));
      this.normalize.scale(size / this.tObj.diagonal);
   }

   private createBuffers() {
      const gl = this.gl;

      // create buffers (and associated attributes)
      this.vertexBuffer = new glAttributeBuffer(gl, this.program, 'aVertex');
      this.normalBuffer = new glAttributeBuffer(gl, this.program, 'aNormal');
      this.indexBuffer = new glIndexBuffer(gl);
   }

   public dispose(): void {
      this.vertexBuffer.dispose();
      this.normalBuffer.dispose();
      this.indexBuffer.dispose();
   }

   private rebuildBuffers() {
      this.dispose();
      this.createBuffers();
      this.uploadTriangles();
   }

   public rotX(angle: number): void {
      this.model.rotX(angle);
   }
   public rotY(angle: number): void {
      this.model.rotY(angle);
   }
   public rotZ(angle: number): void {
      this.model.rotZ(angle);
   }
   public preRotX(angle: number): void {
      this.model.preRotX(angle);
   }
   public preRotY(angle: number): void {
      this.model.preRotY(angle);
   }
   public preRotZ(angle: number): void {
      this.model.preRotZ(angle);
   }
   public scale(scale: number): void {
      this.model.scale(scale);
   }
   public translate(offset: Vec3): void {
      this.model.translate(offset);
   }
   public clearTransforms(): void {
      this.model = Mat4.identity;
   }

   public uploadTriangles(): void {

      this.vertexBuffer.upload(this.tObj.vertices);
      this.normalBuffer.upload(this.tObj.normals);
      this.indexBuffer.upload(this.tObj.indices);
   }

   public draw(): void {

      const gl = this.gl;
      const uni = new glUniform(gl, this.program);
      uni.set('model', this.model.multM(this.normalize));

      this.vertexBuffer.bind();
      this.indexBuffer.bind();
      this.normalBuffer.bind();

      gl.drawElements(gl.TRIANGLES, 3 * this.tObj.numTriangles, gl.UNSIGNED_INT, 0);
   }

   public optimize(normalType: NormalType): void {
      this.tObj.optimize(normalType);
      this.rebuildBuffers();
   }

   private applyToVecs(normals: boolean) {

      const vecs = normals ? this.tObj.normals : this.tObj.vertices;

      // if we're updating normals, ignore translation by setting w=0
      let vec = new Vec4([0, 0, 0, normals ? 0 : 1]);

      const xForm = this.model.multM(this.normalize);
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

   public applyXForm(): void {
      this.applyToVecs(false);
      this.applyToVecs(true);

      this.normalize = Mat4.identity;
      this.model = Mat4.identity;
      this.tObj.findBounds();
      this.rebuildBuffers();
   }
}