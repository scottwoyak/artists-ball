import { gl } from "./Globals";

export class glAttribute {
   private buffer: WebGLBuffer;
   private loc: number;

   public constructor(program: WebGLProgram, name: string) {
      this.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      this.loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(this.loc);
      gl.vertexAttribPointer(this.loc, 3, gl.FLOAT, false, 0, 0);
   }

   public upload(vertices: number[]) {

      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   }
}