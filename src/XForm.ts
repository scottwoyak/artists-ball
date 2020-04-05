import { Mat4 } from "./Mat";
import { Vec3 } from "./Vec";

export class XForm {
   public base = Mat4.identity();
   public mat = Mat4.identity();

   public get(): Mat4 {
      return this.mat.multM(this.base);
   }

   public snap() {
      this.base = this.get();
      this.mat = Mat4.identity();
   }

   public reset() {
      this.mat = Mat4.identity();
   }

   public rotX(angle: number): XForm {
      this.mat.rotX(angle);
      return this;
   }
   public rotY(angle: number): XForm {
      this.mat.rotY(angle);
      return this;
   }
   public rotZ(angle: number): XForm {
      this.mat.rotZ(angle);
      return this;
   }
   public translate(offset: Vec3): XForm {
      this.mat.translate(offset);
      return this;
   }
   public scale(scale: number): XForm {
      this.mat.scale(scale);
      return this;
   }
}