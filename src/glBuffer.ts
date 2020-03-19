import { gl } from "./Globals";

/**
 * Wrapper for a WebGl Buffer and Attribute
 */
export class glBuffer {
   private buffer: WebGLBuffer;
   private attributeLocation: number;

   public constructor(program: WebGLProgram, attributeName: string) {
      this.buffer = gl.createBuffer();
      this.attributeLocation = gl.getAttribLocation(program, attributeName);
   }

   public upload(vertices: number[]) {
      this.bind();
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   }

   public bind() {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.attributeLocation);
      gl.vertexAttribPointer(
         this.attributeLocation,
         3,                // size
         gl.FLOAT,         // type
         false,            // normalized
         0,                // stride
         0                 // offset
      );
   }
}