import { Vec3 } from "./Vec";
import { Mat4 } from "./Mat";
import { IMinMax } from "./BoundingBox";
import { Plane } from "./Plane";

/**
 * A set of points used to define the bounding edges of an object. All points are
 * enclosed in the object
 */
export class BoundingPts {
   private pts: Vec3[];

   public constructor(pts: Vec3[]) {
      this.pts = pts;
   }

   public get(i: number): Vec3 {
      return this.pts[i];
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

   public distToPlane(plane: Plane): IMinMax {
      let ret = {
         min: Number.MAX_VALUE,
         max: -Number.MAX_VALUE,
      }

      this.pts.forEach((pt: Vec3) => {
         let d = plane.distToPt(pt);
         ret.min = Math.min(d, ret.min);
         ret.max = Math.max(d, ret.max);
      });

      return ret;
   }
}