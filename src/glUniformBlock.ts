export class glUniformBlock {
   private gl2: WebGL2RenderingContext = null;
   private blockLocation: number;
   private blockBuffer: WebGLBuffer;

   constructor(
      glCtx: WebGL2RenderingContext,
      program: WebGLProgram,
      blockName: string,
      blockBinding: number
   ) {

      this.gl2 = glCtx;
      let gl2 = this.gl2;

      this.blockLocation = gl2.getUniformBlockIndex(program, blockName);
      gl2.uniformBlockBinding(program, this.blockLocation, blockBinding);

      this.blockBuffer = gl2.createBuffer();
      gl2.bindBufferBase(gl2.UNIFORM_BUFFER, blockBinding, this.blockBuffer);
   }

   delete() {
      let gl2 = this.gl2;
      gl2.deleteBuffer(this.blockBuffer);
   }

   upload(data: Float32Array | Int32Array) {

      let gl2 = this.gl2;
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, this.blockBuffer);
      gl2.bufferData(gl2.UNIFORM_BUFFER, data, gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);
   }
}