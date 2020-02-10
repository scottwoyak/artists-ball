
import { Shaders, Uniforms } from './Shaders';
import { glMat4 } from './glMat';
import { glVec3 } from './glVec';
import { gl } from './index';
import toScreenVertexSource from './toScreenVertex.glsl';
import toScreenFragmentSource from './toScreenFragment.glsl';
import toTextureVertexSource from './toTextureVertex.glsl';
import toTextureFragmentSource from './toTextureFragment.glsl';

/**
 * Rendering mode for displaying the texture
 */
enum RenderMode {
   Color = 0,
   Value = 1,
   Chroma = 2,
}

/**
 * Types for the uniform values
 */
interface IToScreenUniforms {
   uScale: number;
   uXOffset: number;
   uYOffset: number;
   uMode: RenderMode;
   uMaxChroma: number;
}

/**
 * Values that are passed to the shader
 */
let ToScreenUniforms: IToScreenUniforms = {
   uScale: 1.0,
   uXOffset: 0.0,
   uYOffset: 0.0,
   uMode: 0,
   uMaxChroma: 1.0,
}

export class PathTracer {

   private vertexBuffer: WebGLBuffer;

   private frameBuffer: WebGLFramebuffer;
   private textures: WebGLTexture[];
   private renderProgram: WebGLProgram;
   private renderVertexAttribute: number;
   private tracerProgram: WebGLProgram;
   private tracerVertexAttribute: number;
   private pixels: Float32Array;

   private mainView = RenderMode.Color;
   private smallViews = [RenderMode.Chroma, RenderMode.Value];

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

      // create framebuffer
      this.frameBuffer = gl.createFramebuffer();

      let internalFormat: number;
      let format: number;

      // create textures
      if (gl instanceof WebGLRenderingContext) {
         gl.getExtension('OES_texture_float');
         internalFormat = gl.RGBA;
         format = gl.RGBA;
      }

      // Typescript doesn't let you do an 'else if' here and when WebGL2 is
      // not supported, we get an exception, so thus the try-catch
      // see: https://stackoverflow.com/questions/45381122/typescript-type-narrowed-to-never-with-instanceof-in-an-if-else-statement
      try {
         if (gl instanceof WebGL2RenderingContext) {
            gl.getExtension('EXT_color_buffer_float');
            internalFormat = gl.RGBA32F;
            format = gl.RGBA;
         }
      }
      catch (error) {
      }

      // create two textures. One we display and one we draw to
      this.textures = [];
      for (var i = 0; i < 2; i++) {
         this.textures.push(gl.createTexture());
         gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.texImage2D(
            gl.TEXTURE_2D,          // target
            0,                      // level
            internalFormat,         // internal format
            Uniforms.uTextureSize,  // width
            Uniforms.uTextureSize,  // height
            0,                      // border
            format,                 // format
            gl.FLOAT,               // type
            null                    // pixels
         );
      }
      gl.bindTexture(gl.TEXTURE_2D, null);

      // create render shader
      this.renderProgram = Shaders.compileShader(toScreenVertexSource, toScreenFragmentSource);
      this.renderVertexAttribute = gl.getAttribLocation(this.renderProgram, 'vertex');
      gl.enableVertexAttribArray(this.renderVertexAttribute);

      this.tracerProgram = Shaders.compileShader(toTextureVertexSource, toTextureFragmentSource);
      this.tracerVertexAttribute = gl.getAttribLocation(this.tracerProgram, 'vertex');
      gl.enableVertexAttribArray(this.tracerVertexAttribute);
   };

   public restart(): void {
      Uniforms.uSample = 0;
      Uniforms.uPass = 0;
   }

   public updateTexture(modelviewProjection: glMat4, timeSinceStart: number): void {

      // implement aliasing by random sampling within a pixel
      let x = (Math.random() * 2 - 1) / Uniforms.uTextureSize;
      let y = (Math.random() * 2 - 1) / Uniforms.uTextureSize;
      let z = 0;

      let v = new glVec3([x, y, z]);
      let jitter = glMat4.fromTranslation(v);
      let matrix = jitter.multM(modelviewProjection).invert();

      Uniforms.uRay00 = Shaders.getEyeRay(matrix, -1, -1);
      Uniforms.uRay01 = Shaders.getEyeRay(matrix, -1, +1);
      Uniforms.uRay10 = Shaders.getEyeRay(matrix, +1, -1);
      Uniforms.uRay11 = Shaders.getEyeRay(matrix, +1, +1);
      Uniforms.uTimeSinceStart = timeSinceStart;
      Uniforms.uTextureWeight = Uniforms.uSample / (Uniforms.uSample + 1);

      // set uniforms
      gl.useProgram(this.tracerProgram);
      Shaders.setUniforms(this.tracerProgram, Uniforms);

      // render to texture
      gl.viewport(0, 0, Uniforms.uTextureSize, Uniforms.uTextureSize);
      gl.useProgram(this.tracerProgram);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[1], 0);

      gl.vertexAttribPointer(this.tracerVertexAttribute, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      ToScreenUniforms.uMaxChroma = this.getMaxChroma();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // ping pong textures
      this.textures.reverse();

      Uniforms.uPass++;
      if (Uniforms.uPass == Uniforms.uNumPasses) {
         Uniforms.uPass = 0;
         Uniforms.uSample++;
      }
   };

   private getMaxChroma(): number {
      let size = Uniforms.uTextureSize;

      if (this.pixels === undefined) {
         this.pixels = new Float32Array(size * size * 4);
      }

      //      let t1 = window.performance.now();
      gl.readPixels(0, 0, Uniforms.uTextureSize, Uniforms.uTextureSize, gl.RGBA, gl.FLOAT, this.pixels);
      let maxChroma = 0;

      for (let row = 0; row < size; row++) {
         for (let col = 0; col < size; col++) {
            let index = (row * size + col) * 4;
            let r = this.pixels[index + 0];
            let g = this.pixels[index + 1];
            let b = this.pixels[index + 2];
            let a = this.pixels[index + 3];

            // ignore values that are not part of the ball
            if (a === 1) {
               continue;
            }

            let avg = (r + g + b) / 3;
            let chroma = (Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg)) / (4 / 3);

            if (chroma > maxChroma) {
               maxChroma = chroma;
            }
         }
      }

      //      let t2 = window.performance.now();
      //      console.log((t2 - t1) + " ms " + maxChroma);

      return maxChroma;
   }
   public displayTexture(): void {

      var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      let size = document.body.clientWidth;

      if (isMobile === false) {
         size = 512;
      }

      gl.canvas.width = size;
      gl.canvas.height = size;
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(this.renderProgram);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.renderVertexAttribute, 2, gl.FLOAT, false, 0, 0);

      // display the main screen
      ToScreenUniforms.uScale = 1.0;
      ToScreenUniforms.uXOffset = 0.0;
      ToScreenUniforms.uYOffset = 0.0;
      ToScreenUniforms.uMode = this.mainView;
      Shaders.setUniforms(this.renderProgram, ToScreenUniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // display the smaller views
      ToScreenUniforms.uScale = 0.25;
      ToScreenUniforms.uXOffset = 0.25;
      ToScreenUniforms.uYOffset = 0.75;
      ToScreenUniforms.uMode = this.smallViews[0];
      Shaders.setUniforms(this.renderProgram, ToScreenUniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      ToScreenUniforms.uScale = 0.25;
      ToScreenUniforms.uXOffset = 0.75;
      ToScreenUniforms.uYOffset = 0.75;
      ToScreenUniforms.uMode = this.smallViews[1];
      Shaders.setUniforms(this.renderProgram, ToScreenUniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   }

   public swap(pos: number): void {
      let tmp = this.smallViews[pos];
      this.smallViews[pos] = this.mainView;
      this.mainView = tmp;
      this.displayTexture();
   }
}

