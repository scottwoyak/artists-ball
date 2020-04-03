import { glVec3 } from "./glVec";

/**
 * Utility for holding a clip space. Default is values from -1 to 1.
 */
export class glClipSpace {
   public min: glVec3;
   public max: glVec3;

   public get left(): number {
      return this.min.x;
   }
   public get right(): number {
      return this.max.x;
   }

   public get top(): number {
      return this.max.y;
   }
   public get bottom(): number {
      return this.min.y;
   }

   public get near(): number {
      return this.min.z;
   }
   public get far(): number {
      return this.max.z;
   }

   public get width(): number {
      return (this.max.x - this.min.x);
   }

   public get height(): number {
      return (this.max.y - this.min.y);
   }

   public get depth(): number {
      return (this.max.z - this.min.z);
   }

   public constructor(min: glVec3, max: glVec3) {
      this.min = min;
      this.max = max;
   }
}