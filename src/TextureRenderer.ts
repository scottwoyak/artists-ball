import vertexSource from './shaders/TextureRendererVertex.glsl';
import fragmentSource from './shaders/TextureRendererFragment.glsl';
import { gl, isMobile } from './Globals';
import { glCompiler } from './glCompiler';

/**
 * Class that does the work of building the Path Traced texture
 */
export class TextureRenderer {

   private program: WebGLProgram;
   private vertexBuffer: WebGLBuffer;
   private vertexAttribute: number;

   private vertices = [
      -1, -1,
      -1, +1,
      +1, -1,
      +1, +1
   ];

   public constructor() {

      // create vertex buffer - the block we'll draw our rendered texture on
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

      // create shader
      this.program = glCompiler.compile(vertexSource, fragmentSource);
      this.vertexAttribute = gl.getAttribLocation(this.program, 'vertex');
      gl.enableVertexAttribArray(this.vertexAttribute);
   }

   public render(texture: WebGLTexture): void {

      /*
      // size of the actual canvas. The texture we create is drawn to this item
      let size = document.body.clientWidth;

      if (isMobile === false) {
         // not sure why, but this basically becomes full width on my phone
         size = 512;
      }

      gl.canvas.width = size;
      gl.canvas.height = size;
      */
      //gl.canvas.width = 128;
      //gl.canvas.height = 128;

      let size = 512;
      console.log('rendering to texture. Canvas size: ' + gl.canvas.width + ' ' + gl.canvas.height);
      gl.viewport(0, 0, size, size);
      gl.useProgram(this.program);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.vertexAttribute, 2, gl.FLOAT, false, 0, 0);

      // display the main screen
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   }
}

