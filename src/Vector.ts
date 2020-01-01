export class Vector {

   public elements: number[];

   // Constructor function
   public constructor(elements: number[]) {
      this.elements = elements.slice();
   }

   public get length(): number {
      return this.elements.length;
   }

   // Returns the modulus ('length') of the vector
   public modulus(): number {
      return Math.sqrt(this.dot(this));
   }

   // Maps the vector to another vector according to the given function
   public map(fn: (x: number, i: number) => number) {
      var elements = [] as number[];
      this.each(function (x: number, i: number) {
         elements.push(fn(x, i));
      });
      return new Vector(elements);
   }

   // Calls the iterator for each element of the vector in turn
   public each(fn: (e: number, i: number) => void): void {
      var n = this.elements.length, k = n, i;
      do {
         i = k - n;
         fn(this.elements[i], i + 1);
      } while (--n);
   }

   // Returns a new vector created by normalizing the receiver
   public toUnitVector(): Vector {
      var r = this.modulus();
      if (r === 0) { return new Vector(this.elements); }
      return this.map(function (x) { return x / r; });
   }

   // Returns the result of adding the argument to the vector
   public add(v: Vector): Vector {
      if (this.elements.length != v.elements.length) { return null; }
      return this.map(function (x, i) { return x + v.elements[i - 1]; });
      /*
      var V = vector.elements || vector;
      if (this.elements.length != V.length) { return null; }
      return this.map(function(x, i) { return x + V[i-1]; });
      */
   }

   // Returns the result of subtracting the argument from the vector
   public subtract(v: Vector): Vector {

      if (this.elements.length != v.elements.length) { return null; }
      return this.map(function (x, i) { return x - v.elements[i - 1]; });
      /*
      var V = vector.elements || vector;
      if (this.elements.length != V.length) { return null; }
      return this.map(function(x, i) { return x - V[i-1]; });
      */
   }

   // Returns the result of multiplying the elements of the vector by the argument
   public multiply(k: number): Vector {
      return this.map(function (x) { return x * k; });
   }

   // Returns the scalar product of the vector with the argument
   // Both vectors must have equal dimensionality
   public dot(v: Vector): number {
      let product = 0;
      let n = this.elements.length;
      if (n != v.elements.length) { return null; }
      do { product += this.elements[n - 1] * v.elements[n - 1]; } while (--n);
      return product;
      /*
      var V = vector.elements || vector;
      var i, product = 0, n = this.elements.length;
      if (n != V.length) { return null; }
      do { product += this.elements[n-1] * V[n-1]; } while (--n);
      return product;
      */
   }

   // Returns the vector product of the vector with the argument
   // Both vectors must have dimensionality 3
   public cross(v: Vector): Vector {
      if (this.elements.length != 3 || v.elements.length != 3) { return null; }
      var A = this.elements;
      var B = v.elements;
      return new Vector([
         (A[1] * B[2]) - (A[2] * B[1]),
         (A[2] * B[0]) - (A[0] * B[2]),
         (A[0] * B[1]) - (A[1] * B[0])
      ]);
      /*
      var B = vector.elements || vector;
      if (this.elements.length != 3 || B.length != 3) { return null; }
      var A = this.elements;
      return Vector.create([
        (A[1] * B[2]) - (A[2] * B[1]),
        (A[2] * B[0]) - (A[0] * B[2]),
        (A[0] * B[1]) - (A[1] * B[0])
      ]);
      */
   }

   public ensure3(): Vector {
      return new Vector([this.elements[0], this.elements[1], this.elements[2]]);
   };

   public divideByW(): Vector {
      var w = this.elements[this.elements.length - 1];
      var newElements = [];
      for (var i = 0; i < this.elements.length; i++) {
         newElements.push(this.elements[i] / w);
      }
      return new Vector(newElements);
   };

};













