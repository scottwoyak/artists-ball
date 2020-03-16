import { glMat4 } from './glMat';
import { glVec3 } from './glVec';
import vertexSource from './shaders/stdVertex.glsl';
import fragmentSource from './shaders/stdFragment.glsl';
import { gl } from './Globals';
import { TriangleObjFile } from './TriangleObjFile';
import { TriangleCube } from './TriangleCube';
import { TriangleSphere } from './TriangleSphere';
import { glUniform } from './glUniform';
import { glCompiler } from './glCompiler';
import { glAttribute } from './glAttribute';
import { TriangleObj } from './TriangleObj';

/**
 * Class that renders triangles and a light source
 */
export class glRenderer {

   private program: WebGLProgram;
   private vertexAttribute: glAttribute;
   private normalAttribute: glAttribute;

   private model = new glMat4();
   private view = new glMat4();
   private projection = new glMat4();

   private vertices: number[] = [];
   private normals: number[] = [];

   public create(query: string): Promise<void> {

      gl.enable(gl.DEPTH_TEST);

      // create shaders
      this.program = glCompiler.compile(vertexSource, fragmentSource);

      // create attributes (and associated buffers)
      this.vertexAttribute = new glAttribute(this.program, 'aVertex');
      this.normalAttribute = new glAttribute(this.program, 'aNormal');

      if (query && query.toLowerCase() === 'trianglesphere') {
         let radius = 0.75;
         let center = new glVec3([0, 0, 0]);
         let tObj = new TriangleSphere();
         return tObj.create(100, radius, center).then(() => {
            this.uploadTriangles(tObj);
         });
      }
      else if (query && query.toLowerCase() === 'trianglecube') {
         let size = 0.8;
         let center = new glVec3([0, size / 2.0, 0]);
         let tObj = new TriangleCube();
         return tObj.create(size, center).then(() => {
            this.uploadTriangles(tObj);
         });
      }
      else if (query && query.toLowerCase().endsWith('.obj')) {
         let tObj = new TriangleObjFile();
         return tObj.create(query).then(() => {
            this.uploadTriangles(tObj);
            this.orient(tObj, query);
         });
      }
      else {
         return Promise.resolve();
      }
   }

   private pushVec(array: number[], vec: glVec3) {
      array.push(vec.x);
      array.push(vec.y);
      array.push(vec.z);
   }

   private uploadTriangles(tObj: TriangleObj) {

      this.vertices = [];
      this.normals = [];
      if (tObj) {
         for (let i = 0; i < tObj.triangles.length; i++) {
            this.pushVec(this.vertices, tObj.triangles[i].p0);
            this.pushVec(this.vertices, tObj.triangles[i].p1);
            this.pushVec(this.vertices, tObj.triangles[i].p2);

            let normal = tObj.triangles[i].normal;
            this.pushVec(this.normals, normal);
            this.pushVec(this.normals, normal);
            this.pushVec(this.normals, normal);
         }
      }

      this.vertexAttribute.upload(this.vertices);
      this.normalAttribute.upload(this.normals);
   }

   public orient(tObj: TriangleObj, query: string) {

      let center = tObj.center;
      this.model = this.model.translate(new glVec3([-center.x, -center.y, -center.z]));
      this.model = this.model.scale(1.75 / Math.max(tObj.width, tObj.height, tObj.depth));

      if (query.toLowerCase() === 'skull.obj') {
         this.model = this.model.rotX(Math.PI / 2);
         this.model = this.model.rotY(Math.PI);
      }
   }

   public render(mvp: glMat4): void {

      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // size of the actual canvas. The texture we create is drawn to this item
      let size = document.body.clientWidth;

      if (isMobile === false) {
         // not sure why, but this basically becomes full width on my phone
         size = 512;
      }

      gl.canvas.width = size;
      gl.canvas.height = size;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(this.program);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);

      this.model = this.model.rotY(Math.PI / 180);
      let uni = new glUniform(this.program);
      uni.set('model', this.model.transpose());
      uni.set('view', this.view.transpose());
      uni.set('projection', this.projection.transpose());
      gl.drawArrays(gl.TRIANGLES, 0, this.vertices.length / 3);
   }
}