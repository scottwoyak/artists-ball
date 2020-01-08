import { mat4 } from "gl-matrix";
import { jsVec4, jsVec3 } from "./jsVec";

export class jsMat4 {
   private m: mat4;

   public constructor(values?: number[]) {
      if (values) {
         this.m = mat4.fromValues(
            values[0], values[1], values[2], values[3],
            values[4], values[5], values[6], values[7],
            values[8], values[9], values[10], values[11],
            values[12], values[13], values[14], values[15],
         );
      }
      else {
         this.m = mat4.create();
      }
   }

   public multV(v: jsVec4): jsVec4 {
      let vals: number[] = [];

      for (let row = 0; row < 4; row++) {
         let sum = 0;
         for (let col = 0; col < 4; col++) {
            sum += v.get(col) * this.m[row * 4 + col]
         }
         vals.push(sum);
      }
      return new jsVec4(vals);
   }

   public multM(m: jsMat4): jsMat4 {
      let result = new jsMat4();
      mat4.multiply(result.m, this.m, m.m);
      return result;
   }

   public inverse(): jsMat4 {
      let inverse = new jsMat4();
      mat4.invert(inverse.m, this.m);
      return inverse;
   }

   public get(row: number, col: number): number {
      return this.m[4 * row + col];
   }

   public transpose(): jsMat4 {
      let result = new jsMat4();
      mat4.transpose(result.m, this.m);
      return result;
   }

   public static fromTranslation(v: jsVec3): jsMat4 {
      let result = new jsMat4();
      mat4.fromTranslation(result.m, [v.get(0), v.get(1), v.get(2)]);
      return result.transpose();
   }
}