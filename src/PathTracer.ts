
import { Shaders } from './Shaders';
import { glMat4 } from './glMat';
import { glVec3, glVec4 } from './glVec';
import { gl } from './index';
import toScreenVertexSource from './toScreenVertex.glsl';
import toScreenFragmentSource from './toScreenFragment.glsl';
import toTextureVertexSource from './toTextureVertex.glsl';
import toTextureFragmentSource from './toTextureFragment.glsl';
import { glColor } from './glColor';
import { ColorRange } from './ColorRange';
import { Uniforms } from './Uniforms';

/**
 * Rendering mode for displaying the texture
 */
export enum RenderMode {
   Artist = 0,
   Value = 1,
   Chroma = 2,
   Bands = 3,
}

interface IPixelData {
   maxChroma: number,
   avgLightColor: glColor,
   lightestLightColor: glColor,
   darkestLightColor: glColor,
   avgShadowColor: glColor,
   lightestShadowColor: glColor,
   darkestShadowColor: glColor,
   terminatorColor: glColor,
}
/**
 * Class that does the work of building the Path Traced texture
 */
export class PathTracer {

   private vertexBuffer: WebGLBuffer;

   private frameBuffer: WebGLFramebuffer;
   private textures: WebGLTexture[];
   private toScreenProgram: WebGLProgram;
   private toScreenVertexAttribute: number;
   private toTextureProgram: WebGLProgram;
   private toTextureVertexAttribute: number;
   private pixels: Float32Array;

   private mainView = RenderMode.Artist;
   private smallViews = [
      RenderMode.Chroma,
      RenderMode.Value,
      RenderMode.Bands,
   ];

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
      let type: number;

      // create textures
      if (gl instanceof WebGLRenderingContext) {
         let ext = gl.getExtension('OES_texture_half_float');
         if (ext) {
            // Thanks Apple. Always got to do things a little differently
            internalFormat = gl.RGBA;
            format = gl.RGBA;
            type = ext.HALF_FLOAT_OES;
         }
         else {
            // No floating point textures? really fall back to unsigned bytes
            internalFormat = gl.RGBA;
            format = gl.RGBA;
            type = gl.UNSIGNED_BYTE;
         }
      }

      // Typescript doesn't let you do an 'else if' here and when WebGL2 is
      // not supported, we get an exception, so thus the try-catch
      // see: https://stackoverflow.com/questions/45381122/typescript-type-narrowed-to-never-with-instanceof-in-an-if-else-statement
      try {
         if (gl instanceof WebGL2RenderingContext) {
            gl.getExtension('EXT_color_buffer_float');
            internalFormat = gl.RGBA32F;
            format = gl.RGBA;
            type = gl.FLOAT
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
            type,                   // type
            null                    // pixels
         );
      }
      gl.bindTexture(gl.TEXTURE_2D, null);

      // create render shader
      this.toScreenProgram = Shaders.compileShader(toScreenVertexSource, toScreenFragmentSource);
      this.toScreenVertexAttribute = gl.getAttribLocation(this.toScreenProgram, 'vertex');
      gl.enableVertexAttribArray(this.toScreenVertexAttribute);

      this.toTextureProgram = Shaders.compileShader(toTextureVertexSource, toTextureFragmentSource);
      this.toTextureVertexAttribute = gl.getAttribLocation(this.toTextureProgram, 'vertex');
      gl.enableVertexAttribArray(this.toTextureVertexAttribute);
   };

   public get renderMode(): RenderMode {
      return this.mainView;
   }
   public restart(): void {
      Uniforms.uSample = 0;
      Uniforms.uPass = 0;
   }

   private getEyeRay(matrix: glMat4, x: number, y: number): glVec3 {
      let vec = new glVec4([x, y, 0, 1]);
      return matrix.multV(vec).divideByW().subtract(Uniforms.uEye);
   }

   public updateTexture(modelviewProjection: glMat4, timeSinceStart: number): void {

      // implement aliasing by random sampling within a pixel
      let x = (Math.random() * 2 - 1) / Uniforms.uTextureSize;
      let y = (Math.random() * 2 - 1) / Uniforms.uTextureSize;
      let z = 0;

      let v = new glVec3([x, y, z]);
      let jitter = glMat4.fromTranslation(v);
      let matrix = jitter.multM(modelviewProjection).invert();

      Uniforms.uRay00 = this.getEyeRay(matrix, -1, -1);
      Uniforms.uRay01 = this.getEyeRay(matrix, -1, +1);
      Uniforms.uRay10 = this.getEyeRay(matrix, +1, -1);
      Uniforms.uRay11 = this.getEyeRay(matrix, +1, +1);
      Uniforms.uTimeSinceStart = timeSinceStart;
      Uniforms.uTextureWeight = Uniforms.uSample / (Uniforms.uSample + 1);

      // set uniforms
      gl.useProgram(this.toTextureProgram);
      Shaders.setUniforms(this.toTextureProgram, Uniforms);

      // render to texture
      gl.viewport(0, 0, Uniforms.uTextureSize, Uniforms.uTextureSize);
      gl.useProgram(this.toTextureProgram);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[1], 0);

      gl.vertexAttribPointer(this.toTextureVertexAttribute, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      let data = this.getPixelData();
      Uniforms.uMaxChroma = data.maxChroma;

      let cr = new ColorRange([data.darkestLightColor.toHtmlColor(), data.avgLightColor.toHtmlColor(), data.lightestLightColor.toHtmlColor()]);
      Uniforms.uHighlightColor = cr.get(1.0).toGlColor();
      Uniforms.uLightLightColor = cr.get(0.8).toGlColor();
      Uniforms.uMidLightColor = cr.get(0.5).toGlColor();
      Uniforms.uDarkLightColor = cr.get(0.2).toGlColor();

      cr = new ColorRange([data.darkestShadowColor.toHtmlColor(), data.avgShadowColor.toHtmlColor(), data.lightestShadowColor.toHtmlColor()]);
      //Uniforms.uShadowColor = data.terminatorColor;
      Uniforms.uShadowColor = data.avgShadowColor;
      Uniforms.uReflectedLightColor = cr.get(1).toGlColor();
      Uniforms.uDarkAccentColor = cr.get(0.0).toGlColor();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // ping pong textures
      this.textures.reverse();

      Uniforms.uPass++;
      if (Uniforms.uPass == Uniforms.uNumPasses) {
         Uniforms.uPass = 0;
         Uniforms.uSample++;
      }
   };

   private getPixelData(): IPixelData {

      let data: IPixelData = {
         maxChroma: 0,
         avgLightColor: new glColor([0, 0, 0]),
         lightestLightColor: new glColor([0, 0, 0]),
         darkestLightColor: new glColor([1, 1, 1]),
         avgShadowColor: new glColor([0, 0, 0]),
         lightestShadowColor: new glColor([0, 0, 0]),
         darkestShadowColor: new glColor([1, 1, 1]),
         terminatorColor: new glColor([0, 0, 0]),
      }

      let size = Uniforms.uTextureSize;

      if (this.pixels === undefined) {
         this.pixels = new Float32Array(size * size * 4);
      }

      // TODO handle case when the text type is UNSIGNED_BYTE
      gl.readPixels(0, 0, Uniforms.uTextureSize, Uniforms.uTextureSize, gl.RGBA, gl.FLOAT, this.pixels);

      let numLightPixels = 0;
      let numShadowPixels = 0;
      let numTerminatorPixels = 0;

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

            if (chroma > data.maxChroma) {
               data.maxChroma = chroma;
            }

            let color = new glColor([r, g, b]);
            if (a == Uniforms.uBALL_LIGHT) {
               numLightPixels++;
               if (data.lightestLightColor == null) {
                  data.lightestLightColor = color;
               }
               if (data.darkestLightColor == null) {
                  data.darkestLightColor = color;
               }
               data.lightestLightColor = glColor.lightest(data.lightestLightColor, color);
               data.darkestLightColor = glColor.darkest(data.darkestLightColor, color);
               data.avgLightColor.r += color.r;
               data.avgLightColor.b += color.b;
               data.avgLightColor.g += color.g;
            }
            else if (a == Uniforms.uBALL_SHADOW) {
               numShadowPixels++;
               if (data.lightestShadowColor == null) {
                  data.lightestShadowColor = color;
               }
               if (data.darkestShadowColor == null) {
                  data.darkestShadowColor = color;
               }
               data.lightestShadowColor = glColor.lightest(data.lightestShadowColor, color);
               data.darkestShadowColor = glColor.darkest(data.darkestShadowColor, color);
               data.avgShadowColor.r += color.r;
               data.avgShadowColor.b += color.b;
               data.avgShadowColor.g += color.g;
            }

            let terminator = (Uniforms.uBALL_LIGHT + Uniforms.uBALL_SHADOW) / 2.0;
            if (Math.abs(a - terminator) < 0.1) {
               numTerminatorPixels++;
               data.terminatorColor.r += color.r;
               data.terminatorColor.b += color.b;
               data.terminatorColor.g += color.g;
            }
         }
      }

      if (numLightPixels > 0) {
         data.avgLightColor.r /= numLightPixels;
         data.avgLightColor.g /= numLightPixels;
         data.avgLightColor.b /= numLightPixels;
      }
      if (numShadowPixels > 0) {
         data.avgShadowColor.r /= numShadowPixels;
         data.avgShadowColor.g /= numShadowPixels;
         data.avgShadowColor.b /= numShadowPixels;
      }
      if (numTerminatorPixels > 0) {
         data.terminatorColor.r /= numTerminatorPixels;
         data.terminatorColor.g /= numTerminatorPixels;
         data.terminatorColor.b /= numTerminatorPixels;
      }

      return data;
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
      gl.useProgram(this.toScreenProgram);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.toScreenVertexAttribute, 2, gl.FLOAT, false, 0, 0);

      // display the main screen
      Uniforms.uScale = 1.0;
      Uniforms.uXOffset = 0.0;
      Uniforms.uYOffset = 0.0;
      Uniforms.uMode = this.mainView;
      Shaders.setUniforms(this.toScreenProgram, Uniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // display the smaller views
      Uniforms.uScale = 0.25;
      for (let i = 0; i < this.smallViews.length; i++) {
         Uniforms.uXOffset = 1.0 - (this.smallViews.length - i - 0.5) * (2 * Uniforms.uScale);
         Uniforms.uYOffset = 1.0 - Uniforms.uScale;
         Uniforms.uMode = this.smallViews[i];
         Shaders.setUniforms(this.toScreenProgram, Uniforms);
         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
   }

   public swap(pos: number): void {
      this.smallViews = [
         RenderMode.Chroma,
         RenderMode.Value,
         RenderMode.Bands,
      ];
      if (this.mainView == this.smallViews[pos]) {
         this.mainView = RenderMode.Artist;
      }
      else {
         this.mainView = this.smallViews[pos];
         this.smallViews[pos] = RenderMode.Artist;
      }
      this.displayTexture();
   }
}

