import { glVec4, glVec3 } from "./glVec";

export class glMat4 {
   private values: number[];

   public constructor(values?: number[]) {
      if (values) {
         this.values = [...values];
      }
      else {
         this.values = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1];
      }
   }

   public get(row: number, col: number): number {
      return this.values[4 * row + col];
   }

   public set(row: number, col: number, val: number): void {
      this.values[4 * row + col] = val;
   }

   public multV(v: glVec4): glVec4 {
      let vals: number[] = [];

      for (let row = 0; row < 4; row++) {
         let sum = 0;
         for (let col = 0; col < 4; col++) {
            sum += this.values[row * 4 + col] * v.get(col);
         }
         vals.push(sum);
      }
      return new glVec4(vals);
   }

   public multM(other: glMat4): glMat4 {

      let result = new glMat4();

      for (let row = 0; row < 4; row++) {
         for (let col = 0; col < 4; col++) {
            let sum = 0;
            for (let i = 0; i < 4; i++) {
               sum += this.get(row, i) * other.get(i, col);
            }
            result.set(row, col, sum);
         }
      }

      return result;
   }

   public invert(): glMat4 {

      let a00 = this.values[0], a01 = this.values[1], a02 = this.values[2], a03 = this.values[3];
      let a10 = this.values[4], a11 = this.values[5], a12 = this.values[6], a13 = this.values[7];
      let a20 = this.values[8], a21 = this.values[9], a22 = this.values[10], a23 = this.values[11];
      let a30 = this.values[12], a31 = this.values[13], a32 = this.values[14], a33 = this.values[15];

      let b00 = a00 * a11 - a01 * a10;
      let b01 = a00 * a12 - a02 * a10;
      let b02 = a00 * a13 - a03 * a10;
      let b03 = a01 * a12 - a02 * a11;
      let b04 = a01 * a13 - a03 * a11;
      let b05 = a02 * a13 - a03 * a12;
      let b06 = a20 * a31 - a21 * a30;
      let b07 = a20 * a32 - a22 * a30;
      let b08 = a20 * a33 - a23 * a30;
      let b09 = a21 * a32 - a22 * a31;
      let b10 = a21 * a33 - a23 * a31;
      let b11 = a22 * a33 - a23 * a32;

      // Calculate the determinant
      let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

      if (!det) {
         return null;
      }
      det = 1.0 / det;

      this.values[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      this.values[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      this.values[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      this.values[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      this.values[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      this.values[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      this.values[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      this.values[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      this.values[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      this.values[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      this.values[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      this.values[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      this.values[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      this.values[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      this.values[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      this.values[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

      return this;
   }

   public transpose(): glMat4 {
      let result = new glMat4();

      for (let row = 0; row < 4; row++) {
         for (let col = 0; col < 4; col++) {
            result.set(row, col, this.get(col, row));
         }
      }

      this.values = result.values;
      return this;
   }

   public static fromTranslation(v: glVec3): glMat4 {

      let result = new glMat4([
         1, 0, 0, v.get(0),
         0, 1, 0, v.get(1),
         0, 0, 1, v.get(2),
         0, 0, 0, 1
      ]);

      return result;
   }
}