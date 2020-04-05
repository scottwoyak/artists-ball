import vertexSource from './shaders/TextureRendererVertex.glsl';
import fragmentSource from './shaders/TextureRendererFragment.glsl';
import { glCompiler } from './glCompiler';

/**
 * Class that does the work of building the Path Traced texture
 */
export class TextureRenderer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private program: WebGLProgram;
   private vertexBuffer: WebGLBuffer;
   private vertexAttribute: number;

   private vertices = [
      -1, -1,
      -1, +1,
      +1, -1,
      +1, +1
   ];

   public constructor(glCtx: WebGLRenderingContext | WebGL2RenderingContext) {

      this.gl = glCtx;
      let gl = this.gl;

      // create vertex buffer - the block we'll draw our rendered texture on
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

      // create shader
      this.program = glCompiler.compile(gl, vertexSource, fragmentSource);
      this.vertexAttribute = gl.getAttribLocation(this.program, 'vertex');
      gl.enableVertexAttribArray(this.vertexAttribute);
   }

   public render(texture: WebGLTexture, width: number, height: number): void {

      let gl = this.gl;

      gl.viewport(
         (gl.canvas.width - width) / 2,
         (gl.canvas.height - height) / 2,
         width,
         height
      );

      gl.useProgram(this.program);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.vertexAttribute, 2, gl.FLOAT, false, 0, 0);

      // display the main screen
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   }
}

