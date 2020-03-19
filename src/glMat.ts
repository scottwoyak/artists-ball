import { glVec4, glVec3 } from "./glVec";

/**
 * An x-y-z-w matrix for use in WebGL applications.
 */
export class glMat4 {
   /** The matrix value stored as a 16 element array */
   public values: number[];

   /**
    * @param values If supplied, the initial matrix values. If not supplied, the matrix is 
    * initialized as an identity matrix.
    */
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

   /**
    * Creates a copy of the matrix.
    * 
    * @returns A copy of the matrix.
    */
   public clone(): glMat4 {
      return new glMat4(this.values);
   }

   /**
    * Gets a value in the matrix.
    * 
    * @param row The row index.
    * @param col The column index.
    * @returns The matrix value.
    */
   public get(row: number, col: number): number {
      return this.values[4 * row + col];
   }

   /**
    * Sets a value in the matrix.
    * 
    * @param row The row index.
    * @param col The column index.
    * @param val The value.
    */
   public set(row: number, col: number, val: number): void {
      this.values[4 * row + col] = val;
   }

   /**
    * Multiplies this matrix against a vector and returns the result.
    * 
    * @param vec The vector.
    * @return The result of the multiplication. 
    */
   public multV(vec: glVec4): glVec4 {
      let vals: number[] = [];

      for (let row = 0; row < 4; row++) {
         let sum = 0;
         for (let col = 0; col < 4; col++) {
            sum += this.values[row * 4 + col] * vec.values[col];
         }
         vals.push(sum);
      }
      return new glVec4(vals);
   }

   /**
    * Multiplies this matrix against another matrix and returns the result.
    * 
    * @param other The matrix.
    * @return The result of the multiplication. 
    */
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

   /**
    * Inverts this matrix and returns the result (this).
    * 
    * @returns This.
    */
   public invert(): glMat4 {

      let result = new glMat4();

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

      result.values[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
      result.values[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
      result.values[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
      result.values[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
      result.values[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
      result.values[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
      result.values[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
      result.values[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
      result.values[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
      result.values[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
      result.values[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
      result.values[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
      result.values[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
      result.values[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
      result.values[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
      result.values[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

      return result;
   }

   /**
    * Transposes this matrix and returns the result as a new matrix.
    * 
    * @returns The transposed matrix.
    */
   public transpose(): glMat4 {
      let result = new glMat4();

      for (let row = 0; row < 4; row++) {
         for (let col = 0; col < 4; col++) {
            result.set(row, col, this.get(col, row));
         }
      }

      return result;
   }

   /**
    * Creates a matrix that contains a scale operation.
    * 
    * @param scale The scale factor
    * @returns The transformation matrix.
    */
   public static fromScale(scale: number): glMat4 {

      return new glMat4([
         scale, 0, 0, 0,
         0, scale, 0, 0,
         0, 0, scale, 0,
         0, 0, 0, 1
      ]);
   }

   /**
    * Creates a matrix that contains a translation operation.
    * 
    * @param vec The translations.
    * @returns The transformation matrix.
    */
   public static fromTranslation(v: glVec3): glMat4 {

      return new glMat4([
         1, 0, 0, v.values[0],
         0, 1, 0, v.values[1],
         0, 0, 1, v.values[2],
         0, 0, 0, 1
      ]);
   }

   public static fromRotX(angle: number): glMat4 {

      let c = Math.cos(angle)
      let s = Math.sin(angle)
      return new glMat4([
         1, 0, 0, 0,
         0, c, s, 0,
         0, -s, c, 0,
         0, 0, 0, 1
      ]);
   }

   public static fromRotY(angle: number): glMat4 {

      let c = Math.cos(angle)
      let s = Math.sin(angle)
      return new glMat4([
         c, 0, -s, 0,
         0, 1, 0, 0,
         s, 0, c, 0,
         0, 0, 0, 1
      ]);
   }

   public static fromRotZ(angle: number): glMat4 {

      let c = Math.cos(angle)
      let s = Math.sin(angle)
      return new glMat4([
         c, s, 0, 0,
         -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1
      ]);
   }

   public rotX(angle: number) {
      this.values = glMat4.fromRotX(angle).multM(this).values;
   }
   public rotY(angle: number) {
      this.values = glMat4.fromRotY(angle).multM(this).values;
   }
   public rotZ(angle: number) {
      this.values = glMat4.fromRotZ(angle).multM(this).values;
   }
   public translate(offset: glVec3) {
      this.values = glMat4.fromTranslation(offset).multM(this).values;
   }
   public scale(scale: number) {
      this.values = glMat4.fromScale(scale).multM(this).values;
   }

   /**
    * Creates a viewing matrix. See gluLookAt.
    * 
    * @param eye The eye position.
    * @param center The point of interest.
    * @param up The up vector.
    * @returns The viewing matrix.
    */
   public static makeLookAt(eye: glVec3, center: glVec3, up: glVec3, ): glMat4 {

      // clone so we don't modify the origonals
      let z = eye.subtract(center).normalize();
      let x = up.cross(z).normalize();
      let y = z.cross(x).normalize();

      let m = new glMat4([
         x.values[0], x.values[1], x.values[2], 0,
         y.values[0], y.values[1], y.values[2], 0,
         z.values[0], z.values[1], z.values[2], 0,
         0, 0, 0, 1
      ]);

      var t = new glMat4([
         1, 0, 0, -eye.values[0],
         0, 1, 0, -eye.values[1],
         0, 0, 1, -eye.values[2],
         0, 0, 0, 1
      ]);

      let result = m.multM(t);

      return result;
   }

   /**
    * Creates a perspective matrix. See gluPerspective.
    * 
    * @param fovy Field of view (in degrees).
    * @param aspect View aspect ratio.
    * @param znear Near clipping plane.
    * @param zfar Far clipping plane.
    */
   public static makePerspective(
      fovy: number,
      aspect: number,
      znear: number,
      zfar: number): glMat4 {

      var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
      var ymin = -ymax;
      var xmin = ymin * aspect;
      var xmax = ymax * aspect;

      return glMat4.makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
   }

   /**
    * Creates a perspective matrix. See gluFrustum.
    * 
    * @param left The left clipping plane.
    * @param right The right clipping plane.
    * @param bottom The bottom clipping plane.
    * @param top The top clipping plane.
    * @param znear The near clipping plane.
    * @param zfar The far clipping plane.
    * @returns the perspective matrix.
    */
   public static makeFrustum(
      left: number,
      right: number,
      bottom: number,
      top: number,
      znear: number,
      zfar: number): glMat4 {

      var X = 2 * znear / (right - left);
      var Y = 2 * znear / (top - bottom);
      var A = (right + left) / (right - left);
      var B = (top + bottom) / (top - bottom);
      var C = -(zfar + znear) / (zfar - znear);
      var D = -2 * zfar * znear / (zfar - znear);

      return new glMat4([
         X, 0, A, 0,
         0, Y, B, 0,
         0, 0, C, D,
         0, 0, -1, 0
      ]);
   }

   public log(msg: string, digits: number = 2) {
      console.log(msg);
      for (let r = 0; r < 4; r++) {
         let line = "";
         for (let c = 0; c < 4; c++) {
            line += this.get(r, c).toFixed(digits) + ' ';
         }
         console.log(line);
      }
      console.log();
   }

}