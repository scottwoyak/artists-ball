import { Vec3 } from "./Vec";
import { IndexedTriangle } from "./IndexedTriangle";
import { Volume } from "./Volume";
import { Profiler } from "./Profiler";
import { clamp } from "./Globals";
import { BlobFile } from "./BlobFile";
import { IndexedVec3 } from "./IndexedVec3";
import { IVec3 } from "./IVec3";
import { BoundingBox } from "./BoundingBox";

export enum NormalType {
   Smooth,
   Flat
}

export class TriangleObjData {
   name: string;
   vertices: Float32Array;
   normals: Float32Array;
   indices: Int32Array;
   boxMin: Vec3;
   boxMax: Vec3;
}

/**
 * Class used to compute normals for vertices that join multiple faces
 */
class MultiNormVertex {
   private normals: Vec3[] = [];

   /**
    * Stores a normal for this vertex
    * 
    * @param normal Stores a normal for the vertex
    */
   public push(normal: Vec3) {
      this.normals.push(normal);
   }

   /**
    * Computes the normal by averaging all the individual normals associated with the vertex
    */
   public get normal(): Vec3 {
      let n = new Vec3();
      for (let i = 0; i < this.normals.length; i++) {
         n.x += this.normals[i].x;
         n.y += this.normals[i].y;
         n.z += this.normals[i].z;
      }
      n.x /= this.normals.length;
      n.y /= this.normals.length;
      n.z /= this.normals.length;

      return n;
   }
}

/**
 * Base class for representing an object from a bunch of triangles. The class
 * efficiently manages the triangles by storing them in volumes and by
 * passing them to WebGL using Uniform Buffers
 */
export class TriangleObj {
   public vertices: number[] = [];
   public normals: number[] = [];
   public indices: number[] = [];
   public box = new BoundingBox();
   public volumes: Volume[] = [];
   public name: string;

   public get numVertices() {
      return this.vertices.length / 3;
   }

   public get numTriangles() {
      return this.indices.length / 3;
   }

   public get width(): number {
      return this.box.width;
   }

   public get height(): number {
      return this.box.height;
   }

   public get depth(): number {
      return this.box.depth;
   }

   public get diagonal(): number {
      return this.box.diagonal;
   }

   public get center(): Vec3 {
      return this.box.center;
   }

   public constructor(name?: string) {
      this.name = name;
   }

   public getTriangle(index: number): IndexedTriangle {
      let i1 = this.indices[3 * index + 0];
      let i2 = this.indices[3 * index + 1];
      let i3 = this.indices[3 * index + 2];
      return new IndexedTriangle(this.vertices, this.normals, i1, i2, i3);
   }

   /**
    * Scales the object to the specified size and centers it about (0,0,0)
    * 
    * @param size The max size for the width, height, and depth
    */
   public autoCenter(size: number) {
      let p = new Profiler();

      let trans = new Vec3([
         -this.width / 2,
         -this.height / 2,
         -this.depth / 2,
      ]);

      let scale = size / Math.max(this.width, this.height, this.depth);

      for (let i = 0; i < this.numVertices; i++) {
         let v = new IndexedVec3(this.vertices, i);

         v.x = (v.x + trans.x) * scale;
         v.y = (v.y + trans.y) * scale;
         v.z = (v.z + trans.z) * scale;
      }

      this.box.min.x = (this.box.min.x + trans.x) * scale;
      this.box.min.y = (this.box.min.y + trans.y) * scale;
      this.box.min.z = (this.box.min.z + trans.z) * scale;
      this.box.max.x = (this.box.max.x + trans.x) * scale;
      this.box.max.y = (this.box.max.y + trans.y) * scale;
      this.box.max.z = (this.box.max.z + trans.z) * scale;

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
   public translate(offset: Vec3) {

      for (let i = 0; i < this.numVertices; i++) {
         let v = new IndexedVec3(this.vertices, i);

         v.x += offset.x;
         v.y += offset.y;
         v.z += offset.z;
      }

      this.box.min.x += offset.x;
      this.box.min.y += offset.y;
      this.box.min.z += offset.z;
      this.box.max.x += offset.x;
      this.box.max.y += offset.y;
      this.box.max.z += offset.z;

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
      if (this.numTriangles < 40) {
         numSteps = 1;
      } else if (this.numTriangles < 1500) {
         numSteps = 2;
      }
      else {
         numSteps = 3;
      }
      this.volumes = [];
      for (let i = 0; i < Math.pow(numSteps, 3); i++) {
         this.volumes.push(new Volume());
      }

      for (let i = 0; i < this.numTriangles; i++) {
         let t = this.getTriangle(i);
         let x = Math.floor(numSteps * (t.minX - this.box.min.x) / (this.box.width));
         let y = Math.floor(numSteps * (t.minY - this.box.min.y) / (this.box.height));
         let z = Math.floor(numSteps * (t.minZ - this.box.min.z) / (this.box.depth));
         x = clamp(x, 0, numSteps - 1);
         y = clamp(y, 0, numSteps - 1);
         z = clamp(z, 0, numSteps - 1);
         let index = x + y * numSteps + z * numSteps * numSteps;
         this.volumes[index].push(t);
      }
   }


   public pushQuad(v1: IVec3, v2: IVec3, v3: IVec3, v4: IVec3) {

      this.pushTriangle(v1, v2, v3);
      this.pushTriangle(v2, v4, v3);
   }

   public pushTriangle(v1: IVec3, v2: IVec3, v3: IVec3) {

      // add indices
      let i1 = this.numVertices;
      let i2 = i1 + 1;
      let i3 = i1 + 2;
      this.indices.push(i1, i2, i3);

      // add vertices
      this.vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
      this.box.update(v1);
      this.box.update(v2);
      this.box.update(v3);

      // add normals
      let tri = new IndexedTriangle(this.vertices, this.normals, i1, i2, i3);
      let normal = tri.computeNormal();
      this.normals.push(...normal.values);
      this.normals.push(...normal.values);
      this.normals.push(...normal.values);
   }

   public computeNormals(type: NormalType) {

      let p = new Profiler();

      if (type === NormalType.Smooth) {
         let multiNormVertices: MultiNormVertex[] = [];
         for (let i = 0; i < this.numVertices; i++) {
            multiNormVertices.push(new MultiNormVertex());
         }

         // store the normals with each vertex - we'll later average these
         for (let i = 0; i < this.numTriangles; i++) {
            let tri = this.getTriangle(i);
            let n = tri.computeNormal();
            multiNormVertices[tri.i1].push(n);
            multiNormVertices[tri.i2].push(n);
            multiNormVertices[tri.i3].push(n);
         }

         // populate the normals array
         this.normals = [];
         for (let i = 0; i < multiNormVertices.length; i++) {
            this.normals.push(...multiNormVertices[i].normal.values);
         }
      }
      else {
         // to go this way we need to have a unique vector and normal for each triangle
         // corner. Blow away the old stuff and rebuild
         let oldIndices = this.indices;
         let oldVertices = this.vertices;

         // reset everything
         this.vertices = [];
         this.normals = [];
         this.indices = [];

         // rebuild
         for (let i = 0; i < oldIndices.length / 3; i++) {
            let v1 = new IndexedVec3(oldVertices, oldIndices[3 * i + 0]);
            let v2 = new IndexedVec3(oldVertices, oldIndices[3 * i + 1]);
            let v3 = new IndexedVec3(oldVertices, oldIndices[3 * i + 2]);
            this.pushTriangle(v1, v2, v3);
         }
      }

      p.log('computeNormals');
   }

   private x(i: number): number {
      return this.vertices[3 * i + 0];
   }
   private y(i: number): number {
      return this.vertices[3 * i + 1];
   }
   private z(i: number): number {
      return this.vertices[3 * i + 2];
   }

   protected findBounds() {
      for (let i = 0; i < this.numVertices; i++) {
         this.box.min.x = Math.min(this.box.min.x, this.x(i));
         this.box.min.y = Math.min(this.box.min.y, this.y(i));
         this.box.min.z = Math.min(this.box.min.z, this.z(i));

         this.box.max.x = Math.max(this.box.max.x, this.x(i));
         this.box.max.y = Math.max(this.box.max.y, this.y(i));
         this.box.max.z = Math.max(this.box.max.z, this.z(i));
      }
   }

   /**
    * Creates a string in the for .OBJ file format
    * 
    * @returns the string
    */
   public toObjString(digits = 8) {

      let str = '';
      str += '# Vertices: ' + this.vertices.length + '\n';
      str += '# Triangles: ' + this.numTriangles + '\n';
      str += '\n';

      for (let i = 0; i < this.numVertices; i++) {
         let v = this.vertices;
         str += 'v ' + v[3 * i + 0].toPrecision(digits) + ' ' + v[3 * i + 1].toPrecision(digits) + ' ' + v[3 * i + 2].toPrecision(digits) + '\n';
      }
      for (let i = 0; i < this.numVertices; i++) {
         let n = this.normals;
         str += 'vn ' + n[3 * i + 0].toPrecision(digits) + ' ' + n[3 * i + 1].toPrecision(digits) + ' ' + n[3 * i + 2].toPrecision(digits) + '\n';
      }
      for (let i = 0; i < this.numTriangles; i++) {
         let t = this.getTriangle(i);
         str += 'f ' +
            (t.i1 + 1) + '//' + (t.i1 + 1) + ' ' +
            (t.i2 + 1) + '//' + (t.i2 + 1) + ' ' +
            (t.i3 + 1) + '//' + (t.i3 + 1) + '\n';
      }

      return str;
   }

   public optimize(normalType: NormalType) {

      if (normalType === NormalType.Smooth) {

         let vertexToIndexMap = new Map<string, number>();
         let indexToIndexMap = new Map<number, number>();

         // first generate a unique set of vertices
         let uniqueVertices: IndexedVec3[] = [];
         for (let i = 0; i < this.numVertices; i++) {

            let oldVertex = new IndexedVec3(this.vertices, i);
            let key = this.vertices[3 * i + 0].toFixed(4) + ' ' + this.vertices[3 * i + 1].toFixed(4) + ' ' + this.vertices[3 * i + 2].toFixed(4);
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

         // reset all the vertices
         this.vertices = [];
         for (let i = 0; i < uniqueVertices.length; i++) {
            this.vertices.push(uniqueVertices[i].x);
            this.vertices.push(uniqueVertices[i].y);
            this.vertices.push(uniqueVertices[i].z);
         }

         // remap all indices
         for (let i = 0; i < this.indices.length; i++) {
            let oldIndex = this.indices[i];
            this.indices[i] = indexToIndexMap.get(oldIndex + 1) - 1;
         }
      }
      else {
         // nothing to do for flat normals. New vertices and normals are created in 
         // computeNormals() below if needed
      }

      this.computeNormals(normalType);
   }

   public combine(tObj: TriangleObj) {

      // save the value for the first index of the combined objects
      let startIndex = this.numVertices;

      // add the other vertices and normals to ours
      this.vertices.push(...tObj.vertices);
      this.normals.push(...tObj.normals);

      // add the other indices, but offset them properly
      for (let i = 0; i < tObj.indices.length; i++) {
         this.indices.push(startIndex + tObj.indices[i]);
      }

      // merge the bounding boxes
      this.box.merge(tObj.box);
   }

   public toData(): TriangleObjData {

      let data = new TriangleObjData;
      data.name = this.name;
      data.vertices = new Float32Array(this.vertices);
      data.normals = new Float32Array(this.normals);
      data.indices = new Int32Array(this.indices);
      data.boxMin = this.box.min.clone();
      data.boxMax = this.box.max.clone();
      return data;
   }

   public static fromData(data: TriangleObjData): TriangleObj {

      let tObj = new TriangleObj();
      tObj.name = data.name;
      tObj.vertices = Array.from(data.vertices);
      tObj.normals = Array.from(data.normals);
      tObj.indices = Array.from(data.indices);
      tObj.box = new BoundingBox(new Vec3(data.boxMin.values), new Vec3(data.boxMax.values));
      return tObj;
   }

   public toBlob(): Blob {

      // create a description
      let info = {
         FileType: 'Binary OBJ',
         Version: '1.0',
         Name: this.name,
      }

      // get the raw data
      let data = this.toData();

      // break it into parts
      let parts: BlobPart[] = [];
      parts.push(data.vertices);
      parts.push(data.normals);
      parts.push(data.indices);
      parts.push(new Float32Array(data.boxMin.values));
      parts.push(new Float32Array(data.boxMax.values));

      // create the Blob
      return BlobFile.createBlob(info, parts);
   }

   public static async fromBlob(blob: Blob): Promise<TriangleObj> {

      let data = await TriangleObj.blobToData(blob);
      return TriangleObj.fromData(data);
   }

   public static async blobToData(blob: Blob): Promise<TriangleObjData> {

      let data = new TriangleObjData();
      let bFile = await BlobFile.extract(blob);

      data.name = bFile.info.Name;
      data.vertices = new Float32Array(await bFile.parts[0].arrayBuffer());
      data.normals = new Float32Array(await bFile.parts[1].arrayBuffer());
      data.indices = new Int32Array(await bFile.parts[2].arrayBuffer());
      data.boxMin = new Vec3(Array.from(new Float32Array(await bFile.parts[3].arrayBuffer())));
      data.boxMax = new Vec3(Array.from(new Float32Array(await bFile.parts[4].arrayBuffer())));

      return data;
   }
}
