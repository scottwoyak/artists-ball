
import { Shaders, Uniforms } from './Shaders';
import { glMat4 } from './glMat';
import { glVec3 } from './glVec';
import { gl } from './index';
import toScreenVertexSource from './toScreenVertex.glsl';
import toScreenFragmentSource from './toScreenFragment.glsl';
import toTextureVertexSource from './toTextureVertex.glsl';
import toTextureFragmentSource from './toTextureFragment.glsl';
import { glColor } from './glColor';
import { ColorRange } from './ColorRange';

/**
 * Rendering mode for displaying the texture
 */
export enum RenderMode {
   Science = 0,
   Value = 1,
   Chroma = 2,
   Artist = 3,
   Bands = 4,
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
   uBallLightChroma: number;
   uBallShadowChroma: number;
   uBallLightShift: number;
   uBallShadowShift: number;
   uHighlightColor: glColor;
   uLightLightColor: glColor;
   uMidLightColor: glColor;
   uDarkLightColor: glColor;
   uLightestShadowColor: glColor;
   uDarkestShadowColor: glColor;
   uAvgShadowColor: glColor;
   uBALL_SPECULAR: number;
   uBALL_LIGHT: number;
   uBALL_SHADOW: number;
}

/**
 * Values that are passed to the shader
 */
export let ToScreenUniforms: IToScreenUniforms = {
   uScale: 1.0,
   uXOffset: 0.0,
   uYOffset: 0.0,
   uMode: 0,
   uMaxChroma: 1.0,
   uBallLightChroma: 1.0,
   uBallShadowChroma: 1.0,
   uBallLightShift: 0.0,
   uBallShadowShift: 0.0,
   uHighlightColor: undefined,
   uLightLightColor: undefined,
   uMidLightColor: undefined,
   uDarkLightColor: undefined,
   uLightestShadowColor: undefined,
   uDarkestShadowColor: undefined,
   uAvgShadowColor: undefined,
   uBALL_SPECULAR: Uniforms.uBALL_SPECULAR,
   uBALL_LIGHT: Uniforms.uBALL_LIGHT,
   uBALL_SHADOW: Uniforms.uBALL_SHADOW,
}

interface IPixelData {
   maxChroma: number,
   avgLightColor: glColor,
   lightestLightColor: glColor,
   darkestLightColor: glColor,
   avgShadowColor: glColor,
   lightestShadowColor: glColor,
   darkestShadowColor: glColor,
}
/**
 * Class that does the work of building the Path Traced texture
 */
export class PathTracer {

   private vertexBuffer: WebGLBuffer;

   private frameBuffer: WebGLFramebuffer;
   private textures: WebGLTexture[];
   private renderProgram: WebGLProgram;
   private renderVertexAttribute: number;
   private tracerProgram: WebGLProgram;
   private tracerVertexAttribute: number;
   private pixels: Float32Array;

   private mainView = RenderMode.Science;
   private smallViews = [
      RenderMode.Artist,
      RenderMode.Chroma,
      RenderMode.Bands,
      RenderMode.Value,
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
      this.renderProgram = Shaders.compileShader(toScreenVertexSource, toScreenFragmentSource);
      this.renderVertexAttribute = gl.getAttribLocation(this.renderProgram, 'vertex');
      gl.enableVertexAttribArray(this.renderVertexAttribute);

      this.tracerProgram = Shaders.compileShader(toTextureVertexSource, toTextureFragmentSource);
      this.tracerVertexAttribute = gl.getAttribLocation(this.tracerProgram, 'vertex');
      gl.enableVertexAttribArray(this.tracerVertexAttribute);
   };

   public get renderMode(): RenderMode {
      return this.mainView;
   }
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

      let data = this.getPixelData();
      let cr = new ColorRange([data.darkestLightColor.toHtmlColor(), data.avgLightColor.toHtmlColor(), data.lightestLightColor.toHtmlColor()]);
      ToScreenUniforms.uMaxChroma = data.maxChroma;
      ToScreenUniforms.uHighlightColor = cr.get(1.0).toGlColor();
      ToScreenUniforms.uLightLightColor = cr.get(0.8).toGlColor();
      ToScreenUniforms.uMidLightColor = cr.get(0.5).toGlColor();
      ToScreenUniforms.uDarkLightColor = cr.get(0.2).toGlColor();
      ToScreenUniforms.uLightestShadowColor = data.lightestShadowColor;
      ToScreenUniforms.uDarkestShadowColor = data.darkestShadowColor;
      ToScreenUniforms.uAvgShadowColor = data.avgShadowColor;

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
      }

      let size = Uniforms.uTextureSize;

      if (this.pixels === undefined) {
         this.pixels = new Float32Array(size * size * 4);
      }

      // TODO handle case when the text type is UNSIGNED_BYTE
      gl.readPixels(0, 0, Uniforms.uTextureSize, Uniforms.uTextureSize, gl.RGBA, gl.FLOAT, this.pixels);

      let numLightPixels = 0;
      let numShadowPixels = 0;
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
      for (let i = 0; i < this.smallViews.length; i++) {
         ToScreenUniforms.uXOffset = 1.0 - (this.smallViews.length - i - 0.5) * (2 * ToScreenUniforms.uScale);
         ToScreenUniforms.uYOffset = 1.0 - ToScreenUniforms.uScale;
         ToScreenUniforms.uMode = this.smallViews[i];
         Shaders.setUniforms(this.renderProgram, ToScreenUniforms);
         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
   }

   public swap(pos: number): void {
      this.smallViews = [
         RenderMode.Artist,
         RenderMode.Chroma,
         RenderMode.Bands,
         RenderMode.Value,
      ];
      this.mainView = this.smallViews[pos];
      this.smallViews[pos] = RenderMode.Science;
      this.displayTexture();
   }
}

