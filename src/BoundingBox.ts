import { Vec3, Vec4 } from "./Vec";
import { IVec3 } from "./IVec3";
import { Mat4 } from "./Mat";

export class BoundingBox {
   public min: Vec3;
   public max: Vec3;

   public get width(): number {
      return this.max.x - this.min.x;
   }

   public get height(): number {
      return this.max.y - this.min.y;
   }

   public get depth(): number {
      return this.max.z - this.min.z;
   }

   public get diagonal(): number {
      let w = this.width;
      let h = this.height;
      let d = this.depth;
      return Math.sqrt(w * w + h * h + d * d);
   }

   public get center(): Vec3 {
      return new Vec3([
         (this.min.x + this.max.x) / 2,
         (this.min.y + this.max.y) / 2,
         (this.min.z + this.max.z) / 2,
      ]);
   }

   public constructor(min: Vec3 = new Vec3([Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]),
      max: Vec3 = new Vec3([-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE])) {
      this.min = min;
      this.max = max;
   }

   public static get infinite(): BoundingBox {
      const MAX = Number.POSITIVE_INFINITY;
      const MIN = Number.NEGATIVE_INFINITY;
      return new BoundingBox(new Vec3([MIN, MIN, MIN]), new Vec3([MAX, MAX, MAX]));
   }

   public inside(vec: IVec3): boolean {
      if (
         vec.x >= this.min.x && vec.x <= this.max.x &&
         vec.y >= this.min.y && vec.y <= this.max.y &&
         vec.z >= this.min.z && vec.z <= this.max.z
      ) {
         return true;
      }
      else {
         return false;
      }

   }

   public log(msg: string) {
      console.log(msg + ' ' +
         '[' + this.min.x + ', ' + this.min.y + ', ' + this.min.z + ']' +
         '[' + this.max.x + ', ' + this.max.y + ', ' + this.max.z + ']'
      );
   }

   public update(v: IVec3) {
      this.min.x = Math.min(this.min.x, v.x);
      this.min.y = Math.min(this.min.y, v.y);
      this.min.z = Math.min(this.min.z, v.z);
      this.max.x = Math.max(this.max.x, v.x);
      this.max.y = Math.max(this.max.y, v.y);
      this.max.z = Math.max(this.max.z, v.z);
   }

   public merge(other: BoundingBox) {
      this.min.x = Math.min(this.min.x, other.min.x);
      this.min.y = Math.min(this.min.y, other.min.y);
      this.min.z = Math.min(this.min.z, other.min.z);
      this.max.x = Math.max(this.max.x, other.max.x);
      this.max.y = Math.max(this.max.y, other.max.y);
      this.max.z = Math.max(this.max.z, other.max.z);
   }

   public xForm(mat: Mat4): BoundingBox {
      let ret = new BoundingBox();
      let v1 = mat.multV(new Vec4([this.min.x, this.min.y, this.min.z, 1]));
      let v2 = mat.multV(new Vec4([this.max.x, this.max.y, this.max.z, 1]));
      ret.min.x = Math.min(v1.x, v2.x);
      ret.min.y = Math.min(v1.y, v2.y);
      ret.min.z = Math.min(v1.z, v2.z);
      ret.max.x = Math.max(v1.x, v2.x);
      ret.max.y = Math.max(v1.y, v2.y);
      ret.max.z = Math.max(v1.z, v2.z);

      return ret;
   }
}