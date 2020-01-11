
/**
 * Vector class for use with WebGL applications.
 */
class glVec {

   /** The vector values. */
   protected values: number[];

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
    * Gets a value in the vector.
    * 
    * @param index The element index.
    * @returns The element value.
    */
   public get(index: number): number {
      return this.values[index];
   }

   /**
    * Sets a value in the vector.
    * 
    * @param index The element index.
    * @param value The element value.
    */
   public set(index: number, value: number): void {
      this.values[index] = value;
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

   /** 
    * Normalizes this vector, and stores and returns the result.
    * 
    * @returns The resulting normalized vector.
    */
   protected normalize(): glVec {
      let mag = this.magnitude();
      if (mag !== 0) {
         for (let i = 0; i < this.values.length; i++) {
            this.values[i] /= mag;
         }
      }

      return this;
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
    * Creates a copy of the vector.
    * 
    * @returns A copy of the vector.
    */
   public clone(): glVec3 {
      return new glVec3(this.values);
   }

   /** 
    * Normalizes this vector, and stores and returns the result.
    * 
    * @returns The resulting normalized vector.
    */
   public normalize(): glVec3 {
      return super.normalize() as glVec3;
   }

   /**
    * Subtracts values from this vector.
    * 
    * @param vec The vector to subtract.
    * @returns This vector.
    */
   public subtract(vec: glVec3): glVec3 {
      this.values[0] -= vec.values[0];
      this.values[1] -= vec.values[1];
      this.values[2] -= vec.values[2];
      return this;
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

