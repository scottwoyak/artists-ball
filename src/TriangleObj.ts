import { glVec3 } from "./glVec";
import { IndexedTriangle } from "./IndexedTriangle";
import { Volume } from "./Volume";
import { Profiler } from "./Profiler";
import { clamp } from "./Globals";

export enum NormalType {
   Smooth,
   Flat
}

/**
 * Class used to compute normals for vertices that join multiple faces
 */
class MultiNormVertex {
   private normals: glVec3[] = [];

   /**
    * Stores a normal for this vertex
    * 
    * @param normal Stores a normal for the vertex
    */
   public push(normal: glVec3) {
      this.normals.push(normal);
   }

   /**
    * Computes the normal by averaging all the individual normals associated with the vertex
    */
   public get normal(): glVec3 {
      let n = new glVec3();
      for (let i = 0; i < this.normals.length; i++) {
         n.x += this.normals[i].x;
         n.y += this.normals[i].y;
         n.z += this.normals[i].z;
      }
      n.x /= this.normals.length;
      n.y /= this.normals.length;
      n.z /= this.normals.length;

      //console.log(this.normals.length);
      return n;
   }
}
/**
 * Base class for representing an object from a bunch of triangles. The class
 * efficiently manages the triangles by storing them in volumes and by
 * passing them to WebGL using Uniform Buffers
 */
export class TriangleObj {
   public vertices: glVec3[] = [];
   public normals: glVec3[] = [];
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

   /**
    * Breaks the object into evenly spaced volumes. The number of volumes is automatically
    * determined based on the number of triangles.
    */
   public breakIntoVolumes() {
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
         x = clamp(x, 0, numSteps - 1);
         y = clamp(y, 0, numSteps - 1);
         z = clamp(z, 0, numSteps - 1);
         let index = x + y * numSteps + z * numSteps * numSteps;
         this.volumes[index].push(t);
      }
   }

   public computeNormals(type: NormalType) {
      let p = new Profiler();

      let normals: glVec3[] = [];
      let multiNormVertices: MultiNormVertex[] = [];
      if (type === NormalType.Smooth) {
         for (let i = 0; i < this.vertices.length; i++) {
            multiNormVertices.push(new MultiNormVertex());
         }

         // store the normals with each vertex - we'll later average these
         for (let i = 0; i < this.triangles.length; i++) {
            let tri = this.triangles[i];
            let n = tri.computeNormal();
            multiNormVertices[tri.iV0].push(n);
            multiNormVertices[tri.iV1].push(n);
            multiNormVertices[tri.iV2].push(n);
         }

         // create a new normals array
         for (let i = 0; i < multiNormVertices.length; i++) {
            normals.push(multiNormVertices[i].normal);
         }

         // update the triangles
         for (let i = 0; i < this.triangles.length; i++) {
            let tri = this.triangles[i];
            tri.normals = normals;
            tri.iN0 = tri.iV0;
            tri.iN1 = tri.iV1;
            tri.iN2 = tri.iV2;
         }
      }
      else {
         for (let i = 0; i < this.triangles.length; i++) {
            let tri = this.triangles[i];
            normals.push(tri.computeNormal());
            let index = normals.length - 1;

            tri.normals = normals;
            tri.iN0 = index;
            tri.iN1 = index;
            tri.iN2 = index;
         }
      }
      this.normals = normals;

      p.log('computeNormals');
   }

   /**
    * Creates a string in the for .OBJ file format
    * 
    * @returns the string
    */
   public toObjString(digits = 8) {

      let str = '';
      str += '# Vertices: ' + this.vertices.length + '\n';
      str += '# Normals: ' + this.normals.length + '\n';
      str += '# Triangles: ' + this.triangles.length + '\n';
      str += '\n';

      for (let i = 0; i < this.vertices.length; i++) {
         let v = this.vertices[i];
         str += 'v ' + v.x.toPrecision(digits) + ' ' + v.y.toPrecision(digits) + ' ' + v.z.toPrecision(digits) + '\n';
      }
      for (let i = 0; i < this.normals.length; i++) {
         let n = this.normals[i];
         str += 'vn ' + n.x.toPrecision(digits) + ' ' + n.y.toPrecision(digits) + ' ' + n.z.toPrecision(digits) + '\n';
      }
      for (let i = 0; i < this.triangles.length; i++) {
         let t = this.triangles[i];
         str += 'f ' +
            (t.iV0 + 1) + '//' + (t.iN0 + 1) + ' ' +
            (t.iV1 + 1) + '//' + (t.iN1 + 1) + ' ' +
            (t.iV2 + 1) + '//' + (t.iN2 + 1) + '\n';
      }

      return str;
   }

   public optimize(normalType: NormalType) {

      let msg = 'Optimized .OBJ content copied to clipboard\n\n';
      msg += 'Num Triangles: ' + this.triangles.length + '\n';

      let vertexToIndexMap = new Map<string, number>();
      let indexToIndexMap = new Map<number, number>();

      // first generate a unique set of vertices
      let uniqueVertices: glVec3[] = [];
      for (let i = 0; i < this.vertices.length; i++) {

         let oldVertex = this.vertices[i];
         let key = this.vertices[i].toString(4, ' ');
         let oldIndex = i + 1;
         let newIndex;
         if (vertexToIndexMap.has(key)) {
            // just map the old index to the existing entry
            newIndex = vertexToIndexMap.get(key);
         }
         else {
            // create a new entry
            newIndex = uniqueVertices.length + 1;
            vertexToIndexMap.set(key, newIndex);
            uniqueVertices.push(oldVertex);
         }
         // store the translation
         indexToIndexMap.set(oldIndex, newIndex);
      }

      let oldSize = this.vertices.length;
      let newSize = uniqueVertices.length;
      msg += 'Num Vertices: ' + oldSize + ' to ' + newSize + ', ' + (100 * newSize / oldSize).toFixed() + ' %\n';

      // reset all the vertices
      this.vertices = uniqueVertices;
      for (let i = 0; i < this.triangles.length; i++) {
         let tri = this.triangles[i];
         tri.vertices = uniqueVertices;
         tri.iV0 = indexToIndexMap.get(tri.iV0 + 1) - 1;
         tri.iV1 = indexToIndexMap.get(tri.iV1 + 1) - 1;
         tri.iV2 = indexToIndexMap.get(tri.iV2 + 1) - 1;
      }

      oldSize = this.normals.length;
      this.computeNormals(normalType);
      newSize = this.normals.length;
      msg += 'Num Normals: ' + oldSize + ' to ' + newSize + ', ' + (100 * newSize / oldSize).toFixed() + ' %';

      let str = this.toObjString(6);
      navigator.clipboard.writeText(str).then(() => { alert(msg) });
   }
}
