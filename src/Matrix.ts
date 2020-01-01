// === Sylvester ===
// Vector and Matrix mathematics modules for JavaScript
// Copyright (c) 2007 James Coglan
// 
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
// THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

import { Vector } from './Vector';

var Sylvester = {
   version: '0.1.3',
   precision: 1e-6
};



export class Matrix {

   private elements: number[][];

   // Constructor function
   public constructor(els: number[][]) {

      // Set the matrix's elements from an array. If the argument passed
      // is a vector, the resulting matrix will be a single column.
      let i: number;
      let ni = els.length;
      let ki = ni;
      let nj: number;
      let kj: number;
      let j: number;
      this.elements = [];
      do {
         i = ki - ni;
         nj = els[i].length; kj = nj;
         this.elements[i] = [];
         do {
            j = kj - nj;
            this.elements[i][j] = els[i][j];
         } while (--nj);
      } while (--ni);
   }

   // Returns column k of the matrix as a vector
   public col(j: number): Vector {
      if (j > this.elements[0].length) { return null; }
      var col = [], n = this.elements.length, k = n, i;
      do {
         i = k - n;
         col.push(this.elements[i][j - 1]);
      } while (--n);
      return new Vector(col);
   }

   // Returns a copy of the matrix
   public dup(): Matrix {
      return new Matrix(this.elements);
   }

   // Returns the result of multiplying the matrix from the right by the argument.
   // If the argument is a scalar then just multiply all the elements. If the argument is
   // a vector, a vector is returned, which saves you having to remember calling
   // col(1) on the result.
   public multiply(vector: Vector): Vector {
      let elems = [];
      elems.push(vector.elements);
      let m = new Matrix(elems);
      return this.x(m).col(0);
   }

   public x(matrix: Matrix) {
      let M = matrix.elements;
      let ni = this.elements.length;
      let ki = ni;
      let i;
      let nj;
      let kj = M[0].length;
      let j;
      let cols = this.elements[0].length;
      let elements = [] as number[][];
      let sum = 0;
      let nc;
      let c;
      do {
         i = ki - ni;
         elements[i] = [];
         nj = kj;
         do {
            j = kj - nj;
            sum = 0;
            nc = cols;
            do {
               c = cols - nc;
               sum += this.elements[i][c] * M[c][j];
            } while (--nc);
            elements[i][j] = sum;
         } while (--nj);
      } while (--ni);
      return new Matrix(elements);
   }

   // Returns true iff the matrix is square
   public isSquare(): boolean {
      return (this.elements.length == this.elements[0].length);
   }

   // Make the matrix upper (right) triangular by Gaussian elimination.
   // This method only adds multiples of rows to other rows. No rows are
   // scaled up or switched, and the determinant is preserved.
   public toRightTriangular(): Matrix {
      let M = this.dup();
      let els;
      let n = this.elements.length;
      let k = n;
      let i;
      let np;
      let kp = this.elements[0].length;
      let p;
      do {
         i = k - n;
         if (M.elements[i][i] == 0) {
            for (let j = i + 1; j < k; j++) {
               if (M.elements[j][i] != 0) {
                  els = []; np = kp;
                  do {
                     p = kp - np;
                     els.push(M.elements[i][p] + M.elements[j][p]);
                  } while (--np);
                  M.elements[i] = els;
                  break;
               }
            }
         }
         if (M.elements[i][i] != 0) {
            for (let j = i + 1; j < k; j++) {
               var multiplier = M.elements[j][i] / M.elements[i][i];
               els = []; np = kp;
               do {
                  p = kp - np;
                  // Elements with column numbers up to an including the number
                  // of the row that we're subtracting can safely be set straight to
                  // zero, since that's the point of this routine and it avoids having
                  // to loop over and correct rounding errors later
                  els.push(p <= i ? 0 : M.elements[j][p] - M.elements[i][p] * multiplier);
               } while (--np);
               M.elements[j] = els;
            }
         }
      } while (--n);
      return M;
   }

   // Returns the determinant for square matrices
   public determinant(): number {
      let M = this.toRightTriangular();
      let det = M.elements[0][0];
      let n = M.elements.length - 1;
      let k = n;
      let i;
      do {
         i = k - n + 1;
         det = det * M.elements[i][i];
      } while (--n);
      return det;
   }

   // Returns true iff the matrix is singular
   public isSingular(): boolean {
      return (this.isSquare() && this.determinant() === 0);
   }

   // Returns the result of attaching the given argument to the right-hand side of the matrix
   public augment(matrix: Matrix): Matrix {
      let M = matrix.elements;
      var T = this.dup(), cols = T.elements[0].length;
      var ni = T.elements.length, ki = ni, i, nj, kj = M[0].length, j;
      if (ni != M.length) { return null; }
      do {
         i = ki - ni;
         nj = kj;
         do {
            j = kj - nj;
            T.elements[i][cols + j] = M[i][j];
         } while (--nj);
      } while (--ni);
      return T;
   }

   // Returns the inverse (if one exists) using Gauss-Jordan
   public inverse(): Matrix {
      if (!this.isSquare() || this.isSingular()) { return null; }
      var ni = this.elements.length, ki = ni, i, j;
      var M = this.augment(Matrix.I(ni)).toRightTriangular();
      var np, kp = M.elements[0].length, p, els, divisor;
      var inverse_elements = [], new_element;
      // Matrix is non-singular so there will be no zeros on the diagonal
      // Cycle through rows from last to first
      do {
         i = ni - 1;
         // First, normalise diagonal elements to 1
         els = []; np = kp;
         inverse_elements[i] = [];
         divisor = M.elements[i][i];
         do {
            p = kp - np;
            new_element = M.elements[i][p] / divisor;
            els.push(new_element);
            // Shuffle of the current row of the right hand side into the results
            // array as it will not be modified by later runs through this loop
            if (p >= ki) { inverse_elements[i].push(new_element); }
         } while (--np);
         M.elements[i] = els;
         // Then, subtract this row from those above it to
         // give the identity matrix on the left hand side
         for (j = 0; j < i; j++) {
            els = []; np = kp;
            do {
               p = kp - np;
               els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
            } while (--np);
            M.elements[j] = els;
         }
      } while (--ni);
      return new Matrix(inverse_elements);
   }

   // Identity matrix of size n
   public static I(n: number): Matrix {
      let els = [] as number[][];
      let k = n;
      let i;
      let nj;
      let j;
      do {
         i = k - n;
         els[i] = []; nj = k;
         do {
            j = k - nj;
            els[i][j] = (i == j) ? 1 : 0;
         } while (--nj);
      } while (--n);
      return new Matrix(els);
   }

   public static Translation(v: Vector): Matrix {
      if (v.length === 2) {
         var r = Matrix.I(3);
         r.elements[2][0] = v.elements[0];
         r.elements[2][1] = v.elements[1];
         return r;
      }

      if (v.length === 3) {
         var r = Matrix.I(4);
         r.elements[0][3] = v.elements[0];
         r.elements[1][3] = v.elements[1];
         r.elements[2][3] = v.elements[2];
         return r;
      }

      throw "Invalid length for Translation";
   }

   public flatten(): number[] {
      var result = [];
      if (this.elements.length == 0)
         return [];


      for (var j = 0; j < this.elements[0].length; j++)
         for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
      return result;
   }

};














