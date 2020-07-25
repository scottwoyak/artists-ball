import { IVec3, Vec3 } from "./Vec";

export class IndexedVec3 implements IVec3 {

   private values: number[];
   private index: number;

   constructor(values: number[], index: number) {
      this.values = values;
      this.index = index;
   }

   public get x(): number {
      return this.values[3 * this.index + 0];
   }
   public get y(): number {
      return this.values[3 * this.index + 1];
   }
   public get z(): number {
      return this.values[3 * this.index + 2];
   }

   public set x(val: number) {
      this.values[3 * this.index + 0] = val;
   }
   public set y(val: number) {
      this.values[3 * this.index + 1] = val;
   }
   public set z(val: number) {
      this.values[3 * this.index + 2] = val;
   }

   public toVec3(): Vec3 {
      return new Vec3([this.x, this.y, this.z]);
   }
}