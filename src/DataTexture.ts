import { Triangle } from "./Triangle";
import { gl } from "./app";

export class DataTexture {
   public texture: WebGLTexture;
   public textureUnit: number;

   constructor(textureUnit: number) {
      this.textureUnit = textureUnit;
   }

   public create(triangles: Triangle[]): WebGLTexture {

      let oldActive = gl.getParameter(gl.ACTIVE_TEXTURE);
      gl.activeTexture(this.textureUnit);

      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      let width = 4;
      let height = triangles.length + 1;

      let minX = 3.402823466e+38;
      let minY = 3.402823466e+38;
      let minZ = 3.402823466e+38;
      let maxX = -3.402823466e+38;
      let maxY = -3.402823466e+38;
      let maxZ = -3.402823466e+38;
      for (let i = 0; i < triangles.length; i++) {
         minX = Math.min(minX, triangles[i].minX);
         minY = Math.min(minY, triangles[i].minY);
         minZ = Math.min(minZ, triangles[i].minZ);
         maxX = Math.max(maxX, triangles[i].maxX);
         maxY = Math.max(maxY, triangles[i].maxY);
         maxZ = Math.max(maxZ, triangles[i].maxZ);
      }

      // size is 4 floats (vec4) * width * height
      let array = new Float32Array(width * height * 4);

      array[0] = minX;
      array[1] = minY;
      array[2] = minZ;
      array[3] = 0;
      array[4] = maxX;
      array[5] = maxY;
      array[6] = maxZ;
      array[7] = 0;
      array[8] = 0;
      array[9] = 0;
      array[10] = 0;
      array[11] = 0;
      array[12] = 0;
      array[13] = 0;
      array[14] = 0;
      array[15] = 0;

      for (let i = 0; i < triangles.length; i++) {
         array[(i + 1) * width * 4 + 0] = triangles[i].p0.x;
         array[(i + 1) * width * 4 + 1] = triangles[i].p0.y;
         array[(i + 1) * width * 4 + 2] = triangles[i].p0.z;
         array[(i + 1) * width * 4 + 3] = 0;
         array[(i + 1) * width * 4 + 4] = triangles[i].p1.x;
         array[(i + 1) * width * 4 + 5] = triangles[i].p1.y;
         array[(i + 1) * width * 4 + 6] = triangles[i].p1.z;
         array[(i + 1) * width * 4 + 7] = 0;
         array[(i + 1) * width * 4 + 8] = triangles[i].p2.x;
         array[(i + 1) * width * 4 + 9] = triangles[i].p2.y;
         array[(i + 1) * width * 4 + 10] = triangles[i].p2.z;
         array[(i + 1) * width * 4 + 11] = 0;
         array[(i + 1) * width * 4 + 12] = triangles[i].color.r;
         array[(i + 1) * width * 4 + 13] = triangles[i].color.g;
         array[(i + 1) * width * 4 + 14] = triangles[i].color.b;
         array[(i + 1) * width * 4 + 15] = 0;
      }

      gl.texImage2D(gl.TEXTURE_2D,
         0,
         (<WebGL2RenderingContext>gl).RGBA32F,
         4,
         height,
         0,
         gl.RGBA,
         gl.FLOAT,
         array);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      //gl.bindTexture(gl.TEXTURE_2D, null);

      gl.activeTexture(oldActive);

      return this.texture;
   }
}