
/**
 * Wrapper for a WebGl Buffer and Attribute
 */
export class glIndexBuffer {
   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private buffer: WebGLBuffer;

   public constructor(glCtx: WebGLRenderingContext | WebGL2RenderingContext) {
      this.gl = glCtx;
      let gl = this.gl;

      this.buffer = gl.createBuffer();
   }

   public delete() {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = undefined;
   }

   public upload(values: number[] | Int32Array) {
      let gl = this.gl;
      this.bind();

      if (values instanceof Int32Array) {
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, values, gl.STATIC_DRAW);
      }
      else {
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Int32Array(values), gl.STATIC_DRAW);
      }

   }

   public bind() {
      let gl = this.gl;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffer);
   }
}