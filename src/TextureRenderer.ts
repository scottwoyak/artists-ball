import vertexSource from './shaders/TextureRendererVertex.glsl';
import fragmentSource from './shaders/TextureRendererFragment.glsl';
import { glCompiler } from './glCompiler';
import { glBuffer } from './glBuffer';
import { glTexture } from './glTexture';

/**
 * Class that does the work of building the Path Traced texture
 */
export class TextureRenderer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private program: WebGLProgram;
   private vertexBuffer: glBuffer;

   private vertices = [
      -1, -1,
      -1, +1,
      +1, -1,
      +1, +1
   ];

   public constructor(glCtx: WebGLRenderingContext | WebGL2RenderingContext) {

      this.gl = glCtx;
      let gl = this.gl;

      // create shader
      this.program = glCompiler.compile(gl, vertexSource, fragmentSource);

      // create vertex buffer - the block we'll draw our rendered texture on
      this.vertexBuffer = new glBuffer(gl, this.program, 'vertex');
      this.vertexBuffer.upload(this.vertices);
   }

   public render(texture: glTexture, width: number, height: number): void {

      let gl = this.gl;

      gl.viewport(
         (gl.canvas.width - width) / 2,
         (gl.canvas.height - height) / 2,
         width,
         height
      );

      gl.useProgram(this.program);
      texture.bind();
      this.vertexBuffer.bind(2);

      // display the main screen
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   }
}

