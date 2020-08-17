import { glProgram } from './glProgram';

/**
 * Wrapper for a WebGl Buffer and Attribute
 */
export class glBuffer {
   private gl: WebGLRenderingContext | WebGL2RenderingContext;
   private buffer: WebGLBuffer | null;
   private attributeLocation: number;

   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      program: WebGLProgram | glProgram,
      attributeName: string
   ) {
      this.gl = glCtx;
      const gl = this.gl;

      if (program instanceof glProgram) {
         program = program.get();
      }

      this.buffer = gl.createBuffer();
      this.attributeLocation = gl.getAttribLocation(program, attributeName);
   }

   public dispose(): void {
      this.gl.deleteBuffer(this.buffer);
      this.buffer = null;
      this.attributeLocation = -1;
   }

   public upload(vertices: number[]): void {
      const gl = this.gl;
      this.bind();
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   }

   public bind(size = 3): void {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.enableVertexAttribArray(this.attributeLocation);
      gl.vertexAttribPointer(
         this.attributeLocation,
         size,             // size - 2,3 or 4 values per vertex
         gl.FLOAT,         // type
         false,            // normalized
         0,                // stride
         0                 // offset
      );
   }
}