import { Mat4 } from './Mat';
import { Vec3, Vec4 } from './Vec';
import toScreenVertexSource from './shaders/PathTracerToScreenVertex.glsl';
import toScreenFragmentSource from './shaders/PathTracerToScreenFragment.glsl';
import toTextureVertexSource from './shaders/PathTracerToTextureVertex.glsl';
import toTextureFragmentSource from './shaders/PathTracerToTextureFragment.glsl';
import { ColorRange } from './ColorRange';
import { Uniforms } from './Uniforms';
import { isMobile } from './Globals';
import { Profiler } from './Profiler';
import { glUniform } from './glUniform';
import { glCompiler } from './glCompiler';
import { ColorAnalyzer } from './ColorAnalyzer';
import { TriangleObj } from './TriangleObj';
import { glUniformBlock } from './glUniformBlock';

/**
 * Rendering mode for displaying the texture
 */
export enum RenderMode {
   Artist = 0,
   Value = 1,
   Chroma = 2,
   Bands = 3,
}

/**
 * Class that does the work of building the Path Traced texture
 */
export class PathTracerRenderer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private vertexBuffer: WebGLBuffer;
   private frameBuffer: WebGLFramebuffer;
   private textures: WebGLTexture[];
   private toScreenProgram: WebGLProgram;
   private toScreenVertexAttribute: number;
   private toTextureProgram: WebGLProgram;
   private toTextureVertexAttribute: number;
   private analyzer: ColorAnalyzer;

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

   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      tObj: TriangleObj
   ) {

      this.gl = glCtx;
      let gl = this.gl;

      // larger texture is higher resolution, but takes longer to compute
      if (isMobile) {
         Uniforms.uTextureSize = 256;
      }
      else {
         // Uniforms.uTextureSize = 512;
         Uniforms.uTextureSize = 256;
      }
      this.analyzer = new ColorAnalyzer(Uniforms.uTextureSize);

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

      // create toScreen shader
      this.toScreenProgram = glCompiler.compile(gl, toScreenVertexSource, toScreenFragmentSource);
      this.toScreenVertexAttribute = gl.getAttribLocation(this.toScreenProgram, 'vertex');
      gl.enableVertexAttribArray(this.toScreenVertexAttribute);

      this.compileShader(tObj);
   }

   private compileShader(tObj?: TriangleObj) {
      let gl = this.gl;

      let p = new Profiler();
      // create the toTexture shader
      if (tObj && tObj.numTriangles > 0) {
         this.toTextureProgram = glCompiler.compile(
            gl,
            toTextureVertexSource
               .replace('<VERSION>', '#version 300 es')
               .replace('NOTHING', 'USE_TRIANGLES'),
            toTextureFragmentSource
               .replace('<VERSION>', '#version 300 es')
               .replace('NOTHING', 'USE_TRIANGLES')
               .replace('<NUM_VERTICES>', tObj.vertices.length.toString())
               .replace('<NUM_VOLUMES>', tObj.volumes.length.toString())
               .replace('<NUM_TRIANGLES>', tObj.numTriangles.toString())
         );

         // upload triangles to the GPU
         this.uploadUniforms(tObj);
      }
      else {
         this.toTextureProgram = glCompiler.compile(
            gl,
            toTextureVertexSource
               .replace('<VERSION>', ''),
            toTextureFragmentSource
               .replace('<VERSION>', '')
         );
      }
      this.toTextureVertexAttribute = gl.getAttribLocation(this.toTextureProgram, 'vertex');
      gl.enableVertexAttribArray(this.toTextureVertexAttribute);
      p.log('compile');
   }

   /**
    * Uploads all the triangle data to WebGL
    * 
    * @param program The program to upload to
    */
   private uploadUniforms(tObj: TriangleObj) {

      let gl = this.gl as WebGL2RenderingContext;

      // upload the big chunks as Uniform Blocks
      let blockBinding = 2;
      let vBlock = new glUniformBlock(gl, this.toTextureProgram, 'MyVerticesBlock', blockBinding);

      // put the data into a Float32Array for uploading
      let vData = new Float32Array(tObj.vertices.length / 3 * 4);
      for (let i = 0; i < tObj.vertices.length / 3; i++) {
         vData[4 * i + 0] = tObj.vertices[3 * i + 0];
         vData[4 * i + 1] = tObj.vertices[3 * i + 1];
         vData[4 * i + 2] = tObj.vertices[3 * i + 2];
         vData[4 * i + 3] = 0;
      }
      vBlock.upload(vData);

      blockBinding = 3;
      let tBlock = new glUniformBlock(gl, this.toTextureProgram, 'MyTrianglesBlock', blockBinding);

      // put the data into a Float32Array for uploading
      let tData = new Int32Array(tObj.numTriangles * 4);
      let index = 0;
      for (let v = 0; v < tObj.volumes.length; v++) {
         let vol = tObj.volumes[v];
         for (let i = 0; i < vol.triangles.length; i++) {
            let t = vol.triangles[i];
            tData[index++] = t.i1;
            tData[index++] = t.i2;
            tData[index++] = t.i3;
            tData[index++] = 0;
         }
      }
      tBlock.upload(tData);

      // Upload the volume info as a standard uniform
      let uni = new glUniform(gl, this.toTextureProgram);
      let startIndex = 0;
      for (let i = 0; i < tObj.volumes.length; i++) {
         let vol = tObj.volumes[i];
         uni.set('object.volumes[' + i + '].startIndex', startIndex, true);
         uni.set('object.volumes[' + i + '].numTriangles', vol.triangles.length, true);
         uni.set('object.volumes[' + i + '].boxMin', vol.boxMin);
         uni.set('object.volumes[' + i + '].boxMax', vol.boxMax);
         startIndex += vol.triangles.length;
      }
      uni.set('object.boxMin', tObj.boxMin);
      uni.set('object.boxMax', tObj.boxMax);
   }

   public get renderMode(): RenderMode {
      return this.mainView;
   }

   public restart(): void {
      Uniforms.uSample = 0;
   }

   private getEyeRay(matrix: Mat4, x: number, y: number): Vec3 {
      let vec = new Vec4([x, y, 0, 1]);
      return matrix.multV(vec).divideByW().subtract(Uniforms.uEye);
   }

   public updateTexture(modelviewProjection: Mat4): void {

      let gl = this.gl;

      // implement aliasing by random sampling within a pixel
      let x = (Math.random() * 2 - 1) / Uniforms.uTextureSize;
      let y = (Math.random() * 2 - 1) / Uniforms.uTextureSize;
      let z = 0;

      let v = new Vec3([x, y, z]);
      let jitter = Mat4.fromTranslation(v);
      let matrix = jitter.multM(modelviewProjection).inverse();

      Uniforms.uRay00 = this.getEyeRay(matrix, -1, -1);
      Uniforms.uRay01 = this.getEyeRay(matrix, -1, +1);
      Uniforms.uRay10 = this.getEyeRay(matrix, +1, -1);
      Uniforms.uRay11 = this.getEyeRay(matrix, +1, +1);
      // set uniforms
      let uni = new glUniform(gl, this.toTextureProgram);
      uni.setAll(Uniforms);

      // render to texture
      gl.viewport(0, 0, Uniforms.uTextureSize, Uniforms.uTextureSize);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[1], 0);

      gl.vertexAttribPointer(this.toTextureVertexAttribute, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      let data = this.analyzer.run(gl, Uniforms.uLightAlpha, Uniforms.uShadowAlpha);
      Uniforms.uMaxChroma = data.maxChroma;

      let cr = new ColorRange([data.darkestLightColor.toHtmlColor(), data.avgLightColor.toHtmlColor(), data.lightestLightColor.toHtmlColor()]);
      Uniforms.uHighlightColor = data.highlightColor;
      Uniforms.uLightLightColor = cr.get(0.85).toGlColor();
      Uniforms.uMidLightColor = cr.get(0.5).toGlColor();
      Uniforms.uDarkLightColor = cr.get(0.15).toGlColor();

      cr = new ColorRange([data.darkestShadowColor.toHtmlColor(), data.avgShadowColor.toHtmlColor(), data.lightestShadowColor.toHtmlColor()]);
      //Uniforms.uShadowColor = data.terminatorColor;
      Uniforms.uShadowColor = data.avgShadowColor;
      Uniforms.uReflectedLightColor = cr.get(1).toGlColor();
      Uniforms.uDarkAccentColor = cr.get(0.0).toGlColor();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // ping pong textures
      this.textures.reverse();

      Uniforms.uSample++;
      Uniforms.uRandom = Math.random();
   };

   public displayTexture(): void {

      let gl = this.gl;

      // size of the actual canvas. The texture we create is drawn to this item
      let size = document.body.clientWidth;

      if (isMobile === false) {
         // not sure why, but this basically becomes full width on my phone
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
      let uni = new glUniform(gl, this.toScreenProgram);
      Uniforms.uScale = 1.0;
      Uniforms.uXOffset = 0.0;
      Uniforms.uYOffset = 0.0;
      Uniforms.uMode = this.mainView;
      uni.setAll(Uniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // display the smaller views
      Uniforms.uScale = 0.2;
      for (let i = 0; i < this.smallViews.length; i++) {
         Uniforms.uXOffset = 1.0 - (this.smallViews.length - i - 0.5) * (2 * Uniforms.uScale);
         Uniforms.uYOffset = 1.0 - Uniforms.uScale;
         Uniforms.uMode = this.smallViews[i];
         uni.setAll(Uniforms);
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

