import { TriangleObj } from "./TriangleObj";
import { glAttribute } from "./glAttribute";
import { glMat4 } from "./glMat";
import { glVec3 } from "./glVec";
import { gl } from "./Globals";
import { glUniform } from "./glUniform";

export class glStdObject {
   private tObj: TriangleObj;
   private program: WebGLProgram;
   private vertexAttribute: glAttribute;
   private normalAttribute: glAttribute;
   private model = new glMat4();
   private vertices: number[] = [];
   private normals: number[] = [];

   public constructor(tObj: TriangleObj, program: WebGLProgram) {

      this.tObj = tObj;
      this.program = program;

      // create attributes (and associated buffers)
      this.vertexAttribute = new glAttribute(program, 'aVertex');
      this.normalAttribute = new glAttribute(program, 'aNormal');

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


   private pushVec(array: number[], vec: glVec3) {
      array.push(vec.x);
      array.push(vec.y);
      array.push(vec.z);
   }

   public uploadTriangles() {

      this.vertices = [];
      this.normals = [];
      for (let i = 0; i < this.tObj.triangles.length; i++) {
         this.pushVec(this.vertices, this.tObj.triangles[i].p0);
         this.pushVec(this.vertices, this.tObj.triangles[i].p1);
         this.pushVec(this.vertices, this.tObj.triangles[i].p2);

         let normal = this.tObj.triangles[i].normal;
         this.pushVec(this.normals, normal);
         this.pushVec(this.normals, normal);
         this.pushVec(this.normals, normal);
      }

      this.vertexAttribute.upload(this.vertices);
      this.normalAttribute.upload(this.normals);
   }

   public draw() {

      let uni = new glUniform(this.program);
      uni.set('model', this.model.transpose());

      this.vertexAttribute.bind();
      this.vertexAttribute.preDraw();
      this.normalAttribute.bind();
      this.normalAttribute.preDraw();
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
   }
}