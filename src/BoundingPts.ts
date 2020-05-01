import { Vec3 } from "./Vec";
import { Mat4 } from "./Mat";
import { IMinMax } from "./BoundingBox";

export class BoundingPts {
   private pts: Vec3[];
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

   public get center(): Vec3 {
      return new Vec3([
         (this.min.x + this.max.x) / 2,
         (this.min.y + this.max.y) / 2,
         (this.min.z + this.max.z) / 2,
      ]);
   }

   public constructor(pts: Vec3[]) {
      const MAX = Number.POSITIVE_INFINITY;
      const MIN = Number.NEGATIVE_INFINITY;
      this.min = new Vec3([MAX, MAX, MAX]);
      this.max = new Vec3([MIN, MIN, MIN]);

      this.pts = pts;

      this.pts.forEach((pt: Vec3) => {
         this.update(pt);
      });
   }

   public get(i: number): Vec3 {
      return this.pts[i];
   }

   private update(pt: Vec3) {
      this.min.x = Math.min(pt.x, this.min.x);
      this.min.y = Math.min(pt.y, this.min.y);
      this.min.z = Math.min(pt.z, this.min.z);
      this.max.x = Math.max(pt.x, this.max.x);
      this.max.y = Math.max(pt.y, this.max.y);
      this.max.z = Math.max(pt.z, this.max.z);
   }

   public multM(mat: Mat4): BoundingPts {
      let pts: Vec3[] = [];

      this.pts.forEach((pt: Vec3) => {
         pts.push(mat.multV(pt.toVec4(1)).xyz);
      });

      return new BoundingPts(pts);
   }

   public distToPoint(pt: Vec3): IMinMax {
      let ret = {
         min: Number.MAX_VALUE,
         max: -Number.MAX_VALUE,
      }

      this.pts.forEach((pts: Vec3) => {
         let d = pts.distToPoint(pt);
         ret.min = Math.min(d, ret.min);
         ret.max = Math.min(d, ret.max);
      });

      return ret;
   }

   public distToPlane(plane: Vec3): IMinMax {
      let ret = {
         min: Number.MAX_VALUE,
         max: -Number.MAX_VALUE,
         d: [0]
      }
      ret.d = [];

      this.pts.forEach((pts: Vec3) => {
         let d = pts.distToPlane(plane);
         ret.d.push(d);
         ret.min = Math.min(d, ret.min);
         ret.max = Math.max(d, ret.max);
      });

      return ret;
   }
}