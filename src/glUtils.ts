import { Vector } from './Vector';
import { Matrix } from './Matrix';

//
// gluLookAt
//
export function makeLookAt(ex: number, ey: number, ez: number,
   cx: number, cy: number, cz: number,
   ux: number, uy: number, uz: number) {
   var eye = new Vector([ex, ey, ez]);
   var center = new Vector([cx, cy, cz]);
   var up = new Vector([ux, uy, uz]);

   var z = eye.subtract(center).toUnitVector();
   var x = up.cross(z).toUnitVector();
   var y = z.cross(x).toUnitVector();

   var m = new Matrix([
      [x.elements[0], x.elements[1], x.elements[2], 0],
      [y.elements[0], y.elements[1], y.elements[2], 0],
      [z.elements[0], z.elements[1], z.elements[2], 0],
      [0, 0, 0, 1]
   ]);

   var t = new Matrix([
      [1, 0, 0, -ex],
      [0, 1, 0, -ey],
      [0, 0, 1, -ez],
      [0, 0, 0, 1]
   ]);
   return m.x(t);
}

//
// glOrtho
//
export function makeOrtho(left: number, right: number,
   bottom: number, top: number,
   znear: number, zfar: number): Matrix {
   var tx = -(right + left) / (right - left);
   var ty = -(top + bottom) / (top - bottom);
   var tz = -(zfar + znear) / (zfar - znear);

   return new Matrix([[2 / (right - left), 0, 0, tx],
   [0, 2 / (top - bottom), 0, ty],
   [0, 0, -2 / (zfar - znear), tz],
   [0, 0, 0, 1]]);
}

//
// gluPerspective
//
export function makePerspective(fovy: number, aspect: number, znear: number, zfar: number): Matrix {
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
   znear: number, zfar: number): Matrix {
   var X = 2 * znear / (right - left);
   var Y = 2 * znear / (top - bottom);
   var A = (right + left) / (right - left);
   var B = (top + bottom) / (top - bottom);
   var C = -(zfar + znear) / (zfar - znear);
   var D = -2 * zfar * znear / (zfar - znear);

   return new Matrix([[X, 0, A, 0],
   [0, Y, B, 0],
   [0, 0, C, D],
   [0, 0, -1, 0]]);
}


