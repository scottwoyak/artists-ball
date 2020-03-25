
/**
 * Vector class for use with WebGL applications.
 */
class glVec {

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
export class glVec2 extends glVec {

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
   public clone(): glVec2 {
      return new glVec2(this.values);
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
   public distance(other: glVec2): number {
      return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
   }
}

/**
 * An x-y-z vector.
 */
export class glVec3 extends glVec {

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
    * Creates a copy of the vector.
    * 
    * @returns A copy of the vector.
    */
   public clone(): glVec3 {
      return new glVec3(this.values);
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
    * Normalizes this vector, and stores and returns the result.
    * 
    * @returns The resulting normalized vector.
    */
   public normalize(): glVec3 {
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
    * Subtracts values from this vector.
    * 
    * @param vec The vector to subtract.
    * @returns The computed vector.
    */
   public subtract(vec: glVec3): glVec3 {
      return new glVec3([
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
   public add(vec: glVec3): glVec3 {
      return new glVec3([
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
   public cross(other: glVec3): glVec3 {
      let A = this.values;
      let B = other.values;
      return new glVec3([
         A[1] * B[2] - A[2] * B[1],
         A[2] * B[0] - A[0] * B[2],
         A[0] * B[1] - A[1] * B[0]
      ]);
   }
}

/**
 * An x-y-z-w vector.
 */
export class glVec4 extends glVec {

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
    * Returns an x-y-z vector where each element is computed by dividing this vectors
    * elements by the w value.
    * 
    * @returns An x-y-z vector.
    */
   public divideByW(): glVec3 {
      let w = this.values[3];
      return new glVec3([
         this.values[0] / w,
         this.values[1] / w,
         this.values[2] / w
      ]);
   }
}

