import { Vec3 } from "./Vec";
import { IndexedTriangle } from "./IndexedTriangle";
import { Profiler } from "./Profiler";
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
   source: string;
   vertices: Float32Array;
   normals: Float32Array;
   indices: Int32Array;
   boxMin: Vec3;
   boxMax: Vec3;
}

/**
 * Base class for representing an object from a bunch of triangles.
 */
export class TriangleObj {
   public vertices: number[] = [];
   public normals: number[] = [];
   public indices: number[] = [];
   public box = new BoundingBox();
   public name: string;
   public source: string;

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

   public findBounds() {
      let box = new BoundingBox();

      for (let i = 0; i < this.numTriangles; i++) {
         let tri = this.getTriangle(i);
         box.update(tri.v1);
         box.update(tri.v2);
         box.update(tri.v3);
      }

      this.box = box;
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

   public trim(box: BoundingBox) {
      let p = new Profiler();
      let indices: number[] = [];
      for (let i = 0; i < this.numTriangles; i++) {
         let tri = this.getTriangle(i);

         if (box.inside(tri.v1) && box.inside(tri.v2) && box.inside(tri.v3)) {
            indices.push(tri.i1);
            indices.push(tri.i2);
            indices.push(tri.i3);
         }
      }
      console.log('trimmed ' + (this.indices.length - indices.length) + ' triangles');
      this.indices = indices;
      this.findBounds();
      p.log('Trip Complete');
   }

   public mirror(x: number, add: boolean) {
      let p = new Profiler();

      if (add) {
         // duplicate vertices
         let numVertices = this.numVertices;
         for (let i = 0; i < numVertices; i++) {
            this.vertices[3 * i + 0] -= x;;
            this.vertices.push(-this.vertices[3 * i + 0]);
            this.vertices.push(this.vertices[3 * i + 1]);
            this.vertices.push(this.vertices[3 * i + 2]);
            this.normals.push(-this.normals[3 * i + 0]);
            this.normals.push(this.normals[3 * i + 1]);
            this.normals.push(this.normals[3 * i + 2]);
         }

         let numIndices = this.indices.length;
         let startIndex = numVertices;
         for (let i = 0; i < numIndices; i++) {
            this.indices.push(startIndex + this.indices[i]);
         }
      }
      else {
         // reflect vertices
         let numVertices = this.numVertices;
         for (let i = 0; i < numVertices; i++) {
            this.vertices[3 * i + 0] = x + (x - this.vertices[3 * i + 0]);
            this.normals[3 * i + 0] = -this.normals[3 * i + 0];
         }
      }

      this.findBounds();

      p.log('Mirror Complete');
   }

   public reverse() {
      let p = new Profiler();

      // reflect vertices
      let x = this.center.x;
      for (let i = 0; i < this.numVertices; i++) {
         this.vertices[3 * i + 0] = x + (x - this.vertices[3 * i + 0]);
         this.normals[3 * i + 0] = -this.normals[3 * i + 0];
      }

      // reorder triangles to preserve front-back facing
      for (let i = 0; i < this.numTriangles; i++) {
         let i1 = this.indices[3 * i + 0];
         let i2 = this.indices[3 * i + 1];
         this.indices[3 * i + 0] = i2;
         this.indices[3 * i + 1] = i1;
      }

      p.log('Reverse Complete');
   }

   public combine(tObj: TriangleObj) {

      // save the value for the first index of the combined objects
      let startIndex = this.numVertices;

      // add the other vertices and normals to ours
      for (let i = 0; i < tObj.vertices.length; i++) {
         this.vertices.push(tObj.vertices[i]);
         this.normals.push(tObj.normals[i]);
      }

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
         Source: this.source,
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
      data.source = bFile.info.Source;
      data.vertices = new Float32Array(await bFile.parts[0].arrayBuffer());
      data.normals = new Float32Array(await bFile.parts[1].arrayBuffer());
      data.indices = new Int32Array(await bFile.parts[2].arrayBuffer());
      data.boxMin = new Vec3(Array.from(new Float32Array(await bFile.parts[3].arrayBuffer())));
      data.boxMax = new Vec3(Array.from(new Float32Array(await bFile.parts[4].arrayBuffer())));

      return data;
   }
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

