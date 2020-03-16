import { glVec3 } from "./glVec";
import { glUniformBlock } from "./glUniformBlock";
import { ITriangleObj } from "./ITriangleObj";
import { IndexedTriangle } from "./IndexedTriangle";
import { Volume } from "./Volume";
import { glUniform } from "./glUniform";
import { Profiler } from "./Profiler";

/**
 * Base class for representing an object from a bunch of triangles. The class
 * efficiently manages the triangles by storing them in volumes and by
 * passing them to WebGL using Uniform Buffers
 */
export class TriangleObj implements ITriangleObj {
   public vertices: glVec3[] = [];
   public triangles: IndexedTriangle[] = [];
   public boxMin = new glVec3([Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]);
   public boxMax = new glVec3([-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE]);
   public volumes: Volume[] = [];

   public get width(): number {
      return this.boxMax.x - this.boxMin.x;
   }

   public get height(): number {
      return this.boxMax.y - this.boxMin.y;
   }

   public get depth(): number {
      return this.boxMax.z - this.boxMin.z;
   }

   public get center(): glVec3 {
      return new glVec3([
         (this.boxMin.x + this.boxMax.x) / 2,
         (this.boxMin.y + this.boxMax.y) / 2,
         (this.boxMin.z + this.boxMax.z) / 2,
      ]);
   }

   protected push(tri: IndexedTriangle) {
      this.triangles.push(tri);
      this.boxMin.x = Math.min(this.boxMin.x, tri.minX);
      this.boxMin.y = Math.min(this.boxMin.y, tri.minY);
      this.boxMin.z = Math.min(this.boxMin.z, tri.minZ);
      this.boxMax.x = Math.max(this.boxMax.x, tri.maxX);
      this.boxMax.y = Math.max(this.boxMax.y, tri.maxY);
      this.boxMax.z = Math.max(this.boxMax.z, tri.maxZ);
   }

   /**
    * Scales the object to the specified size and centers it about (0,0,0)
    * 
    * @param size The max size for the width, height, and depth
    */
   public autoCenter(size: number) {
      let p = new Profiler();

      let trans = new glVec3([
         -(this.boxMax.x + this.boxMin.x) / 2,
         -(this.boxMax.y + this.boxMin.y) / 2,
         -(this.boxMax.z + this.boxMin.z) / 2,
      ]);

      let scale = size / Math.max(this.width, this.height, this.depth);

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

      for (let i = 0; i < this.volumes.length; i++) {
         let v = this.volumes[i];
         v.boxMin.x = (v.boxMin.x + trans.x) * scale;
         v.boxMin.y = (v.boxMin.y + trans.y) * scale;
         v.boxMin.z = (v.boxMin.z + trans.z) * scale;
         v.boxMax.x = (v.boxMax.x + trans.x) * scale;
         v.boxMax.y = (v.boxMax.y + trans.y) * scale;
         v.boxMax.z = (v.boxMax.z + trans.z) * scale;
      }

      p.log('autoAdjust()');
   }

   /**
    * Shift the object in space.
    * 
    * @param offset The amount to shift
    */
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

   /**
    * Breaks the object into evenly spaced volumes. The number of volumes is automatically
    * determined based on the number of triangles.
    */
   protected breakIntoVolumes() {
      let numSteps;
      if (this.triangles.length < 40) {
         numSteps = 1;
      } else if (this.triangles.length < 1500) {
         numSteps = 2;
      }
      else {
         numSteps = 3;
      }
      this.volumes = [];
      for (let i = 0; i < Math.pow(numSteps, 3); i++) {
         this.volumes.push(new Volume());
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
   }

   /**
    * Creates a string in the for .OBJ file format
    * 
    * @returns the string
    */
   public toObjString() {
      let str = "";
      for (let i = 0; i < this.vertices.length; i++) {
         let v = this.vertices[i];
         str += 'v ' + v.x + ' ' + v.y + ' ' + v.z + '\n';
      }
      for (let i = 0; i < this.triangles.length; i++) {
         let t = this.triangles[i];
         str += 'f ' + (t.i0 + 1) + ' ' + (t.i1 + 1) + ' ' + (t.i2 + 1) + '\n';
      }

      return str;
   }

   /**
    * Uploads all the triangle data to WebGL
    * 
    * @param program The program to upload to
    */
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
      let uni = new glUniform(program);
      let startIndex = 0;
      for (let i = 0; i < this.volumes.length; i++) {
         let vol = this.volumes[i];
         uni.set('object.volumes[' + i + '].startIndex', startIndex, true);
         uni.set('object.volumes[' + i + '].numTriangles', vol.triangles.length, true);
         uni.set('object.volumes[' + i + '].boxMin', vol.boxMin);
         uni.set('object.volumes[' + i + '].boxMax', vol.boxMax);
         startIndex += vol.triangles.length;
      }
      uni.set('object.boxMin', this.boxMin);
      uni.set('object.boxMax', this.boxMax);
   }
}
