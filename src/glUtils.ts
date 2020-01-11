import { glVec3 } from './glVec';
import { glMat4 } from './glMat';

//
// gluLookAt
//
export function makeLookAt(
   ex: number, ey: number, ez: number,
   cx: number, cy: number, cz: number,
   ux: number, uy: number, uz: number
) {

   var eye = new glVec3([ex, ey, ez]);
   var center = new glVec3([cx, cy, cz]);
   var up = new glVec3([ux, uy, uz]);

   let z = eye.subtract(center).normalize();
   let x = up.cross(z).normalize();
   let y = z.cross(x).normalize();

   let m = new glMat4([
      x.get(0), x.get(1), x.get(2), 0,
      y.get(0), y.get(1), y.get(2), 0,
      z.get(0), z.get(1), z.get(2), 0,
      0, 0, 0, 1
   ]);

   var t = new glMat4([
      1, 0, 0, -ex,
      0, 1, 0, -ey,
      0, 0, 1, -ez,
      0, 0, 0, 1
   ]);

   let result = m.multM(t);

   return result;
}

/*
function compare(title: string, oldM: Matrix, newM: glMat4) {
   console.log(title);
   for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
         let n1 = oldM.col(col + 1).elements[row];
         let n2 = newM.get(row, col);
         let diff = n1 - n2;
         if (diff > 0.0001) {
            console.log('[' + row + ',' + col + '] ' + diff);
         }
      }
   }
}
*/

//
// gluPerspective
//
export function makePerspective(fovy: number, aspect: number, znear: number, zfar: number): glMat4 {
   var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
   var ymin = -ymax;
   var xmin = ymin * aspect;
   var xmax = ymax * aspect;

   return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
export function makeFrustum(left: number, right: number,
   bottom: number, top: number,
   znear: number, zfar: number): glMat4 {
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


