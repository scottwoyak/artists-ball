
class glVec {
   protected values: number[];

   protected constructor(valuesOrSize:number|number[]) {      
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

   public get(index: number): number {
      return this.values[index];
   }

   public set(index: number, value: number): void {
      this.values[index] = value;
   }

   public magnitude(): number {
      let sum = 0;
      for ( let i = 0; i < this.values.length; i++) {
         sum += this.values[i] * this.values[i];
      }
      return Math.sqrt(sum);
   }

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

export class glVec3 extends glVec {

   public constructor(vals?: number[]) {
      if (vals) {
         super(vals);
      }      
      else {
         super(3);
      }
   }

   public normalize() : glVec3 {
      return super.normalize() as glVec3;
   }

   public subtract(vec: glVec3): glVec3 {
      this.values[0] -= vec.values[0];
      this.values[1] -= vec.values[1];
      this.values[2] -= vec.values[2];
      return this;
   }

   public cross(v: glVec3): glVec3 {
      let A = this.values;
      let B = v.values;
      return new glVec3([
         A[1] * B[2] - A[2] * B[1],
         A[2] * B[0] - A[0] * B[2],
         A[0] * B[1] - A[1] * B[0]
      ]);
   }
}

export class glVec4 extends glVec {

   public constructor(vals?: number[]) {
      if (vals) {
         super(vals);
      }      
      else {
         super(4);
      }
   }

   public divideByW(): glVec3 {
      let w = this.values[3];
      return new glVec3([
         this.values[0] / w, 
         this.values[1] / w, 
         this.values[2] / w
      ]);
   }
}

