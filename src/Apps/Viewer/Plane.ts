import { Vec3 } from '../../Util3D/Vec';

/**
 * Represents a plane defined by a*x + b*y + c*z = d
 */
export class Plane {
   private a: number;
   private b: number;
   private c: number;
   private d: number;
   private origin: Vec3;
   private distanceTerm: number;

   /**
    * @param pt A point on the plane perpendicular to the origin
    * @param origin If the perpendicular point is not the origin, specify it here
    */
   public constructor(pt: Vec3, origin?: Vec3) {
      if (!origin) {
         origin = Vec3.origin;
      }
      this.origin = origin;
      this.a = origin.x - pt.x;
      this.b = origin.y - pt.y;
      this.c = origin.z - pt.z;
      this.d = this.a * this.a + this.b * this.b + this.c * this.c;
      this.distanceTerm = Math.sqrt(this.d);
   }

   /**
    * Computes the distance to a point.
    * 
    * @param pt The point.
    * @returns the Distance.
    */
   public distToPt(pt: Vec3): number {
      const x = pt.x - this.origin.x;
      const y = pt.y - this.origin.y;
      const z = pt.z - this.origin.z;
      return Math.abs(this.a * x + this.b * y + this.c * z + this.d) / this.distanceTerm;
   }
}