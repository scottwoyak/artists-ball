import { vec3 } from 'gl-matrix';
import { vec4 } from 'gl-matrix';

export class jsVec3 {
   private v: vec3;

   public constructor(vals?:number[]) {
      if(vals) {
      this.v = vec3.fromValues(vals[0], vals[1], vals[2]);
      }
      else {
         this.v = vec3.create();
      }
   }

   public get(index: number) : number {
      return this.v[index];
   }

   public set(index: number, value: number) : void {
      this.v[index] = value;
   }

   public subtract(vec:jsVec3) : jsVec3 {
      this.v[0] -= vec.v[0];
      this.v[1] -= vec.v[1];
      this.v[2] -= vec.v[2];
      return this;
   }

   public toUnitVector(): jsVec3 {
      let mag = vec3.length(this.v);
      if (mag === 0) { 
         return new jsVec3([this.v[0], this.v[1], this.v[2] ]); 
      }
      else {
         return new jsVec3([this.v[0]/mag, this.v[1]/mag, this.v[2]/mag ]); 
      }
   }

   public cross(v:jsVec3):jsVec3 {
      let result = new jsVec3();
      vec3.cross(result.v, this.v, v.v);
      return result;
   }
}

export class jsVec4 {
   private v: vec4;

   public constructor(vals:number[]) {
      this.v = vec4.fromValues(vals[0], vals[1], vals[2], vals[3]);
   }   

   public get(index:number) : number {
      return this.v[index];
   }

   public divideByW() : jsVec3 {
      let w = this.v[3];
      return new jsVec3([this.v[0]/w, this.v[1]/w, this.v[2]/w]);
   }

}

