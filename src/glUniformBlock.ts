import { gl } from "./Globals";

export class glUniformBlock {
   private blockLocation: number;
   private blockBuffer: WebGLBuffer;

   constructor(program: WebGLProgram, blockName: string, blockBinding: number) {

      let gl2 = gl as WebGL2RenderingContext;

      this.blockLocation = gl2.getUniformBlockIndex(program, blockName);
      gl2.uniformBlockBinding(program, this.blockLocation, blockBinding);

      this.blockBuffer = gl2.createBuffer();
      gl2.bindBufferBase(gl2.UNIFORM_BUFFER, blockBinding, this.blockBuffer);
   }

   upload(data: Float32Array | Int32Array) {

      let gl2 = gl as WebGL2RenderingContext;
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, this.blockBuffer);
      gl2.bufferData(gl2.UNIFORM_BUFFER, data, gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);

      /*
      var uniformBlockBuffer = gl2.createBuffer();
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, uniformBlockBuffer);
      gl2.bufferData(gl2.UNIFORM_BUFFER, triangleData, gl2.STATIC_DRAW);
      gl2.bindBuffer(gl2.UNIFORM_BUFFER, null);
      gl2.bindBufferBase(gl2.UNIFORM_BUFFER, 2, uniformBlockBuffer);
      */

   }
}