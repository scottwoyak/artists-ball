import { IVec3 } from "./IVec3";

/**
 * Vector class for use with WebGL applications.
 */
class Vec {

   /** The vector values. */
   public values: number[];

   /**
    * @param valuesOrSize If a array, the values for the vector. If a number, the size of the vector.
    */
   protected constructor(valuesOrSize: number | number[]) {
      if (valuesOrSize instanceof Array) {
         this.values = [...valuesOrSize];
      }
      else {
         this.values = new Array(valuesOrSize);
         for (let i = 0; i < valuesOrSize; i++) {
            this.values[i] = 0;
         }
      }
   }

   /**
    * Computes the magnitude of the vector.
    * 
    * @return The vector magnitude.
    */
   public magnitude(): number {
      let sum = 0;
      for (let i = 0; i < this.values.length; i++) {
         sum += this.values[i] * this.values[i];
      }
      return Math.sqrt(sum);
   }
}

/**
 * An x-y vector.
 */
export class Vec2 extends Vec {

   /**
    * @param vals If supplied, the initial values for the vector
    */
   public constructor(vals?: number[]) {
      if (vals) {
         super(vals);
      }
      else {
         super(2);
      }
   }

   /**
    * Creates a copy of the vector.
    *
    * @returns A copy of the vector.
    */
   public clone(): Vec2 {
      return new Vec2(this.values);
   }

   /**
    * Gets the X component of the vector
    * 
    * @returns The value
    */
   public get x(): number {
      return this.values[0];
   }

   /**
    * Sets the X component of the vector
    * 
    * @param val The value
    */
   public set x(val: number) {
      this.values[0] = val;
   }

   /**
    * Gets the Y component of the vector
    *
    * @returns The value
    */
   public get y(): number {
      return this.values[1];
   }

   /**
    * Sets the Y component of the vector
    * 
    * @param val The value
    */
   public set y(val: number) {
      this.values[1] = val;
   }

   /**
    * Computes the distance to another point
    * 
    * @param other The other point
    * @returns The distance between this point and the other point
    */
   public distance(other: Vec2): number {
      return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
   }
}

/**
 * An x-y-z vector.
 */
export class Vec3 extends Vec implements IVec3 {

   public static get origin() {
      return new Vec3([0, 0, 0]);
   }

   /**
    * @param vals If supplied, the initial values for the vector
    */
   public constructor(vals?: number[]) {
      if (vals) {
         super(vals);
      }
      else {
         super(3);
      }
   }

   /**
    * Gets the X component of the vector
    * 
    * @returns The value
    */
   public get x(): number {
      return this.values[0];
   }

   /**
    * Sets the X component of the vector
    * 
    * @param val The value
    */
   public set x(val: number) {
      this.values[0] = val;
   }

   /**
    * Gets the Y component of the vector
    *
    * @returns The value
    */
   public get y(): number {
      return this.values[1];
   }

   /**
    * Sets the Y component of the vector
    * 
    * @param val The value
    */
   public set y(val: number) {
      this.values[1] = val;
   }

   /**
    * Gets the Z component of the vector
    *
    * @returns The value
    */
   public get z(): number {
      return this.values[2];
   }

   /**
    * Sets the Z component of the vector
    * 
    * @param val The value
    */
   public set z(val: number) {
      this.values[2] = val;
   }

   /**
    * Gets the x-y components as a 2d vec
    *
    * @return the Vec3
    */
   public get xy(): Vec2 {
      return new Vec2([this.x, this.y]);
   }

   /**
    * Creates a copy of the vector.
    * 
    * @returns A copy of the vector.
    */
   public clone(): Vec3 {
      return new Vec3(this.values);
   }

   /**
    * Creates a string representation of the vector
    * 
    * @param digits The number of decimal places to display. This value is passed to toFixed().
    * @param divider The string to separate each number.
    * @returns A string representation.
    */
   public toString(digits: number, divider = ','): string {
      return this.x.toFixed(digits) + divider + this.y.toFixed(digits) + divider + this.z.toFixed(digits);
   }

   /** 
    * Returns a normalized version of this vector.
    * 
    * @returns The resulting normalized vector.
    */
   public normalize(): Vec3 {
      let mag = this.magnitude();
      if (mag === 0) {
         return new Vec3();
      }
      else {
         return this.mult(1 / mag);
      }
   }

   /**
    * Multiplies members by a value and returns the new vector
    * 
    * @param value The multiplication value.
    */
   public mult(value: number): Vec3 {
      return new Vec3([
         this.x * value,
         this.y * value,
         this.z * value,
      ]);
   }

   /**
    * Returns the vector pointing in the opposite direction.
    * 
    * @returns The negated vector.
    */
   public negate(): Vec3 {
      return new Vec3([-this.x, -this.y, -this.z]);
   }

   /**
    * Subtracts values from this vector.
    * 
    * @param vec The vector to subtract.
    * @returns The computed vector.
    */
   public subtract(vec: Vec3): Vec3 {
      return new Vec3([
         this.values[0] - vec.values[0],
         this.values[1] - vec.values[1],
         this.values[2] - vec.values[2]
      ]);
   }

   /**
    * Adds values from this vector.
    * 
    * @param vec The vector to add.
    * @returns The computed vector.
    */
   public add(vec: Vec3): Vec3 {
      return new Vec3([
         this.values[0] + vec.values[0],
         this.values[1] + vec.values[1],
         this.values[2] + vec.values[2]
      ]);
   }

   /**
    * Computes the cross product of this vector and another vector.
    * 
    * @param other The other vector.
    */
   public cross(other: Vec3): Vec3 {
      let A = this.values;
      let B = other.values;
      return new Vec3([
         A[1] * B[2] - A[2] * B[1],
         A[2] * B[0] - A[0] * B[2],
         A[0] * B[1] - A[1] * B[0]
      ]);
   }

   /**
    * Computes the distance from this point to a specified point.
    * 
    * @param pt The point.
    * @returns The distance to the point.
    */
   public distanceToPt(pt: Vec3): number {
      return this.subtract(pt).magnitude();
   }

   /**
    * Computes the distance from this point to a plane defined as a*x + b*y + c*z = d
    * 
    * @param plane The plane coefficients.
    * @returns The distance to the plane.
    */
   public distanceToPlane(plane: Vec3): number {
      let a = plane.x;
      let b = plane.y;
      let c = plane.z;
      let d = -(a * a + b * b + c * c);

      return Math.abs(a * this.x + b * this.y + c * this.z + d) / Math.sqrt(a * a + b * b + c * c);
   }
}

/**
 * An x-y-z-w vector.
 */
export class Vec4 extends Vec {

   /**
    * @param vals If supplied, the initial values for the vector
    */
   public constructor(vals?: number[]) {
      if (vals) {
         super(vals);
      }
      else {
         super(4);
      }
   }

   /**
    * Gets the X component of the vector
    * 
    * @returns The value
    */
   public get x(): number {
      return this.values[0];
   }

   /**
    * Sets the X component of the vector
    * 
    * @param val The value
    */
   public set x(val: number) {
      this.values[0] = val;
   }

   /**
    * Gets the Y component of the vector
    *
    * @returns The value
    */
   public get y(): number {
      return this.values[1];
   }

   /**
    * Sets the Y component of the vector
    * 
    * @param val The value
    */
   public set y(val: number) {
      this.values[1] = val;
   }

   /**
    * Gets the Z component of the vector
    *
    * @returns The value
    */
   public get z(): number {
      return this.values[2];
   }

   /**
    * Sets the Z component of the vector
    * 
    * @param val The value
    */
   public set z(val: number) {
      this.values[2] = val;
   }

   /**
    * Gets the Z component of the vector
    *
    * @returns The value
    */
   public get w(): number {
      return this.values[3];
   }

   /**
    * Sets the Z component of the vector
    * 
    * @param val The value
    */
   public set w(val: number) {
      this.values[3] = val;
   }

   /**
    * Gets the x-y-z components as a 3d vec
    * 
    * @return the Vec3
    */
   public get xyz(): Vec3 {
      return new Vec3([this.x, this.y, this.z]);
   }

   /**
    * Creates a copy of the vector.
    * 
    * @returns A copy of the vector.
    */
   public clone(): Vec4 {
      return new Vec4(this.values);
   }

   /**
    * Returns an x-y-z vector where each element is computed by dividing this vectors
    * elements by the w value.
    * 
    * @returns An x-y-z vector.
    */
   public divideByW(): Vec3 {
      let w = this.values[3];
      return new Vec3([
         this.values[0] / w,
         this.values[1] / w,
         this.values[2] / w
      ]);
   }

   /** 
    * Normalizes this vector, and stores and returns the result.
    * 
    * @returns The resulting normalized vector.
    */
   public normalize(): Vec4 {
      let mag = this.magnitude();
      let ret = this.clone();
      if (mag !== 0) {
         for (let i = 0; i < this.values.length; i++) {
            ret.values[i] /= mag;
         }
      }

      return ret;
   }

   /**
    * Creates a Vec4 from a Vec3 object
    * 
    * @param vec The Vec3 object
    * @param w The w value for the Vec4
    */
   public static fromVec3(vec: Vec3, w: number): Vec4 {
      return new Vec4([vec.x, vec.y, vec.z, 1]);
   }
}

