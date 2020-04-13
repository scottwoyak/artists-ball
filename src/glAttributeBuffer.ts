import { glProgram } from "./glProgram";

/**
 * Wrapper for a WebGl Buffer and Attribute
 */
export class glAttributeBuffer {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private buffer: WebGLBuffer;
   private attributeLocation: number;

   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      program: WebGLProgram | glProgram,
      attributeName: string
   ) {
      this.gl = glCtx;
      let gl = this.gl;

      if (program instanceof glProgram) {
         program = program.get();
      }

      this.buffer = gl.createBuffer();
      this.attributeLocation = gl.getAttribLocation(program, attributeName);
   }

   public delete() {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = undefined;
      this.attributeLocation = undefined;
   }

   public upload(values: number[] | Float32Array) {
      let gl = this.gl;
      this.bind();

      if (values instanceof Float32Array) {
         gl.bufferData(gl.ARRAY_BUFFER, values, gl.STATIC_DRAW);
      }
      else {
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      }

   }

   public bind(size = 3) {
      let gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.attributeLocation);
      gl.vertexAttribPointer(
         this.attributeLocation,
         size,             // size
         gl.FLOAT,         // type
         false,            // normalized
         0,                // stride
         0                 // offset
      );
   }
}