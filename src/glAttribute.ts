import { gl } from "./Globals";

export class glAttribute {
   private buffer: WebGLBuffer;
   private loc: number;

   public constructor(program: WebGLProgram, name: string) {
      this.buffer = gl.createBuffer();
      this.loc = gl.getAttribLocation(program, name);
   }

   public upload(vertices: number[]) {
      this.bind();
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
   }

   public bind() {
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
   }

   public preDraw() {
      gl.enableVertexAttribArray(this.loc);
      gl.vertexAttribPointer(this.loc, 3, gl.FLOAT, false, 0, 0);
   }
}