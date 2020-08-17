/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Vec3, IVec3 } from './Vec';
import { BoundingBox } from './BoundingBox';
import { BoundingPts } from './BoundingPts';
import { IndexedTriangle } from './IndexedTriangle';
import { IndexedVec3 } from './IndexedVec3';
import { clamp } from '../Util/Globals';
import { Profiler } from '../Util/Profiler';
import { BlobFile } from '../Util/BlobFile';

export enum NormalType {
   Smooth,
   Flat
}

export interface ITriangleObjData {
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
   public name: string | undefined;
   public source: string;
   private boundingPts: BoundingPts;

   public get numVertices(): number {
      return this.vertices.length / 3;
   }

   public get numTriangles(): number {
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
      const i1 = this.indices[3 * index + 0];
      const i2 = this.indices[3 * index + 1];
      const i3 = this.indices[3 * index + 2];
      return new IndexedTriangle(this.vertices, this.normals, i1, i2, i3);
   }

   public pushQuad(v1: IVec3, v2: IVec3, v3: IVec3, v4: IVec3): void {

      this.pushTriangle(v1, v2, v3);
      this.pushTriangle(v2, v4, v3);
   }

   public pushTriangle(v1: IVec3, v2: IVec3, v3: IVec3): void {

      // add indices
      const i1 = this.numVertices;
      const i2 = i1 + 1;
      const i3 = i1 + 2;
      this.indices.push(i1, i2, i3);

      // add vertices
      this.vertices.push(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
      this.box.update(v1);
      this.box.update(v2);
      this.box.update(v3);

      // add normals
      const tri = new IndexedTriangle(this.vertices, this.normals, i1, i2, i3);
      const normal = tri.computeNormal();
      this.normals.push(...normal.values);
      this.normals.push(...normal.values);
      this.normals.push(...normal.values);
   }

   public computeNormals(type: NormalType): void {

      if (type === NormalType.Smooth) {
         const multiNormVertices: MultiNormVertex[] = [];
         for (let i = 0; i < this.numVertices; i++) {
            multiNormVertices.push(new MultiNormVertex());
         }

         // store the normals with each vertex - we'll later average these
         for (let i = 0; i < this.numTriangles; i++) {
            const tri = this.getTriangle(i);
            const n = tri.computeNormal();
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
         const oldIndices = this.indices;
         const oldVertices = this.vertices;

         // reset everything
         this.vertices = [];
         this.normals = [];
         this.indices = [];

         // rebuild
         for (let i = 0; i < oldIndices.length / 3; i++) {
            const v1 = new IndexedVec3(oldVertices, oldIndices[3 * i + 0]);
            const v2 = new IndexedVec3(oldVertices, oldIndices[3 * i + 1]);
            const v3 = new IndexedVec3(oldVertices, oldIndices[3 * i + 2]);
            this.pushTriangle(v1, v2, v3);
         }
      }
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

   public findBounds(): void {
      console.log('finding bounds');
      const box = new BoundingBox();

      for (let i = 0; i < this.numTriangles; i++) {
         const tri = this.getTriangle(i);
         box.update(tri.v1);
         box.update(tri.v2);
         box.update(tri.v3);
      }

      this.box = box;
   }

   /**
    * Breaks the object into evenly spaced volumes. The number of volumes is automatically
    * determined based on the number of triangles.
    */
   public getBoundingPts(): BoundingPts {

      if (this.boundingPts) {
         return this.boundingPts;
      }

      const numSteps = 15;

      const boxes: BoundingBox[] = [];
      for (let i = 0; i < Math.pow(numSteps, 3); i++) {
         boxes.push(new BoundingBox());
      }

      const v = new Vec3();
      for (let i = 0; i < this.numVertices; i++) {
         v.x = this.vertices[3 * i + 0];
         v.y = this.vertices[3 * i + 1];
         v.z = this.vertices[3 * i + 2];
         let x = Math.floor(numSteps * (v.x - this.box.min.x) / (this.box.width));
         let y = Math.floor(numSteps * (v.y - this.box.min.y) / (this.box.height));
         let z = Math.floor(numSteps * (v.z - this.box.min.z) / (this.box.depth));
         x = clamp(x, 0, numSteps - 1);
         y = clamp(y, 0, numSteps - 1);
         z = clamp(z, 0, numSteps - 1);
         const index = x + y * numSteps + z * numSteps * numSteps;
         boxes[index].update(v);
      }

      const boxMap = new Map<number, BoundingBox>();
      let boxCount = 0;
      for (let x = 0; x < numSteps; x++) {
         for (let y = 0; y < numSteps; y++) {
            let first: {
               index: number,
               box: BoundingBox,
            };
            let last: {
               index: number,
               box: BoundingBox,
            };
            for (let z = 0; z < numSteps; z++) {
               const index = x + y * numSteps + z * numSteps * numSteps;
               const box = boxes[index];
               if (box.min.x === Number.MAX_VALUE) {
                  continue;
               }
               boxCount++;
               if (!first) {
                  first = { index: index, box: box };
               }
               last = { index: index, box: box };
            }

            if (first && boxMap.has(first.index) === false) {
               boxMap.set(first.index, first.box);
            }
            if (last && boxMap.has(last.index) === false) {
               boxMap.set(last.index, last.box);
            }
         }
      }

      const pts: Vec3[] = [];
      boxes.forEach((box) => {
         if (box.min.x !== Number.MAX_VALUE) {
            pts.push(...box.corners);
         }
      });

      this.boundingPts = new BoundingPts(pts);
      return this.boundingPts;
   }

   /**
    * Creates a string in the for .OBJ file format
    * 
    * @returns the string
    */
   public toObjString(digits = 8): string {

      let str = '';
      str += '# Vertices: ' + this.vertices.length + '\n';
      str += '# Triangles: ' + this.numTriangles + '\n';
      str += '\n';

      for (let i = 0; i < this.numVertices; i++) {
         const v = this.vertices;
         str += 'v ' + v[3 * i + 0].toPrecision(digits) + ' ' + v[3 * i + 1].toPrecision(digits) + ' ' + v[3 * i + 2].toPrecision(digits) + '\n';
      }
      for (let i = 0; i < this.numVertices; i++) {
         const n = this.normals;
         str += 'vn ' + n[3 * i + 0].toPrecision(digits) + ' ' + n[3 * i + 1].toPrecision(digits) + ' ' + n[3 * i + 2].toPrecision(digits) + '\n';
      }
      for (let i = 0; i < this.numTriangles; i++) {
         const t = this.getTriangle(i);
         str += 'f ' +
            (t.i1 + 1) + '//' + (t.i1 + 1) + ' ' +
            (t.i2 + 1) + '//' + (t.i2 + 1) + ' ' +
            (t.i3 + 1) + '//' + (t.i3 + 1) + '\n';
      }

      return str;
   }

   public optimize(normalType: NormalType): void {

      if (normalType === NormalType.Smooth) {

         const vertexToIndexMap = new Map<string, number>();
         const indexToIndexMap = new Map<number, number>();

         // first generate a unique set of vertices
         const uniqueVertices: IndexedVec3[] = [];
         for (let i = 0; i < this.numVertices; i++) {

            const oldVertex = new IndexedVec3(this.vertices, i);
            const key = this.vertices[3 * i + 0].toFixed(4) + ' ' + this.vertices[3 * i + 1].toFixed(4) + ' ' + this.vertices[3 * i + 2].toFixed(4);
            const oldIndex = i + 1;
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
            const oldIndex = this.indices[i];
            this.indices[i] = indexToIndexMap.get(oldIndex + 1) - 1;
         }
      }
      else {
         // nothing to do for flat normals. New vertices and normals are created in 
         // computeNormals() below if needed
      }

      this.computeNormals(normalType);
   }

   public trim(box: BoundingBox): void {
      const p = new Profiler();
      const indices: number[] = [];
      for (let i = 0; i < this.numTriangles; i++) {
         const tri = this.getTriangle(i);

         if (box.inside(tri.v1) && box.inside(tri.v2) && box.inside(tri.v3)) {
            indices.push(tri.i1);
            indices.push(tri.i2);
            indices.push(tri.i3);
         }
      }
      console.log('trimmed ' + (this.indices.length - indices.length) + ' triangles');
      this.indices = indices;
      this.findBounds();
      p.log('Trim Complete');
   }

   public mirror(x: number, add: boolean): void {
      const p = new Profiler();

      if (add) {
         // duplicate vertices
         const numVertices = this.numVertices;
         for (let i = 0; i < numVertices; i++) {
            this.vertices[3 * i + 0] -= x;
            this.vertices.push(-this.vertices[3 * i + 0]);
            this.vertices.push(this.vertices[3 * i + 1]);
            this.vertices.push(this.vertices[3 * i + 2]);
            this.normals.push(-this.normals[3 * i + 0]);
            this.normals.push(this.normals[3 * i + 1]);
            this.normals.push(this.normals[3 * i + 2]);
         }

         const numIndices = this.indices.length;
         const startIndex = numVertices;
         for (let i = 0; i < numIndices; i++) {
            this.indices.push(startIndex + this.indices[i]);
         }
      }
      else {
         // reflect vertices
         const numVertices = this.numVertices;
         for (let i = 0; i < numVertices; i++) {
            this.vertices[3 * i + 0] = x + (x - this.vertices[3 * i + 0]);
            this.normals[3 * i + 0] = -this.normals[3 * i + 0];
         }
      }

      this.findBounds();

      p.log('Mirror Complete');
   }

   public reverse(): void {
      const p = new Profiler();

      // reflect vertices
      const x = this.center.x;
      for (let i = 0; i < this.numVertices; i++) {
         this.vertices[3 * i + 0] = x + (x - this.vertices[3 * i + 0]);
         this.normals[3 * i + 0] = -this.normals[3 * i + 0];
      }

      // reorder triangles to preserve front-back facing
      for (let i = 0; i < this.numTriangles; i++) {
         const i1 = this.indices[3 * i + 0];
         const i2 = this.indices[3 * i + 1];
         this.indices[3 * i + 0] = i2;
         this.indices[3 * i + 1] = i1;
      }

      p.log('Reverse Complete');
   }

   public combine(tObj: TriangleObj): void {

      // save the value for the first index of the combined objects
      const startIndex = this.numVertices;

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

   public toData(): ITriangleObjData {

      return {
         source: this.source,
         name: this.name,
         vertices: new Float32Array(this.vertices),
         normals: new Float32Array(this.normals),
         indices: new Int32Array(this.indices),
         boxMin: this.box.min.clone(),
         boxMax: this.box.max.clone(),
      }
   }

   public static fromData(data: ITriangleObjData): TriangleObj {

      const tObj = new TriangleObj();
      tObj.name = data.name;
      tObj.vertices = Array.from(data.vertices);
      tObj.normals = Array.from(data.normals);
      tObj.indices = Array.from(data.indices);
      tObj.box = new BoundingBox(new Vec3(data.boxMin.values), new Vec3(data.boxMax.values));
      return tObj;
   }

   public toBlob(): Blob {

      // create a description
      const info = {
         FileType: 'Binary OBJ',
         Version: '1.0',
         Name: this.name,
         Source: this.source,
      }

      // get the raw data
      const data = this.toData();

      // break it into parts
      const parts: BlobPart[] = [];
      parts.push(data.vertices);
      parts.push(data.normals);
      parts.push(data.indices);
      parts.push(new Float32Array(data.boxMin.values));
      parts.push(new Float32Array(data.boxMax.values));

      // create the Blob
      return BlobFile.createBlob(info, parts);
   }

   public static async fromBlob(blob: Blob): Promise<TriangleObj> {

      const data = await TriangleObj.blobToData(blob);
      return TriangleObj.fromData(data);
   }

   public static async blobToData(blob: Blob): Promise<ITriangleObjData> {

      const bFile = await BlobFile.extract(blob);

      return {
         name: bFile.info.Name,
         source: bFile.info.Source,
         vertices: new Float32Array(await bFile.parts[0].arrayBuffer()),
         normals: new Float32Array(await bFile.parts[1].arrayBuffer()),
         indices: new Int32Array(await bFile.parts[2].arrayBuffer()),
         boxMin: new Vec3(Array.from(new Float32Array(await bFile.parts[3].arrayBuffer()))),
         boxMax: new Vec3(Array.from(new Float32Array(await bFile.parts[4].arrayBuffer()))),
      }
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
      const n = new Vec3();
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

