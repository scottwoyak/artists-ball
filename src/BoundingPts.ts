import { Vec3 } from "./Vec";
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

      this.pts.forEach((pt2: Vec3) => {
         let x = pt2.x - pt.x;
         let y = pt2.y - pt.y;
         let z = pt2.z - pt.z;
         let d = x * x + y * y + z * z;
         ret.min = Math.min(d, ret.min);
         ret.max = Math.max(d, ret.max);
      });

      // don't bother getting the square root of every calculation, just the min and max
      ret.min = Math.sqrt(ret.min);
      ret.max = Math.sqrt(ret.max);

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