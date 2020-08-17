
/**
 * Wrapper for a WebGl Buffer and Attribute
 */
export class glIndexBuffer {
   private gl: WebGLRenderingContext | WebGL2RenderingContext;
   private buffer: WebGLBuffer | null;

   public constructor(glCtx: WebGLRenderingContext | WebGL2RenderingContext) {
      this.gl = glCtx;
      const gl = this.gl;

      this.buffer = gl.createBuffer();
   }

   public dispose(): void {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
   }

   public upload(values: number[] | Int32Array): void {
      const gl = this.gl;
      this.bind();

      if (values instanceof Int32Array) {
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, values, gl.STATIC_DRAW);
      }
      else {
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(values), gl.STATIC_DRAW);
      }

   }

   public bind(): void {
      const gl = this.gl;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
   }
}