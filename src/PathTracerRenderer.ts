import { Mat4 } from './Mat';
import { Vec3, Vec4 } from './Vec';
import toScreenVertexSource from './shaders/PathTracerToScreenVertex.glsl';
import toScreenFragmentSource from './shaders/PathTracerToScreenFragment.glsl';
import toTextureVertexSource from './shaders/PathTracerToTextureVertex.glsl';
import toTextureFragmentSource from './shaders/PathTracerToTextureFragment.glsl';
import { ColorRange } from './ColorRange';
import { isMobile } from './Globals';
import { Profiler } from './Profiler';
import { glUniform } from './glUniform';
import { glCompiler } from './glCompiler';
import { ColorAnalyzer } from './ColorAnalyzer';
import { TriangleObj } from './TriangleObj';
import { glUniformBlock } from './glUniformBlock';
import { glTexture, glTextureStyle } from './glTexture';
import { glFrameBuffer } from './glFrameBuffer';
import { PathTracerObj } from './PathTracerObj';
import { glColor3 } from './glColor';
import { SphericalCoord } from './SphericalCoord';

/**
 * Rendering mode for displaying the texture
 */
export enum RenderMode {
   Artist = 0,
   Value = 1,
   Chroma = 2,
   Bands = 3,
}

class Uniforms {
   uScale = 1.0;
   uXOffset = 0.0;
   uYOffset = 0.0;
   uMode = 0;
   uMaxChroma = 1.0;

   uHighlightColor: glColor3;
   uLightLightColor: glColor3;
   uMidLightColor: glColor3;
   uDarkLightColor: glColor3;

   uShadowColor: glColor3;
   uReflectedLightColor: glColor3;
   uDarkAccentColor: glColor3;
   uLightAlpha = 1001;
   uShadowAlpha = 1000;

   uLightIntensity = 0.7;
   uLightColor = new glColor3([1.0, 1.0, 1.0]);
   uLightPos = new Vec3(new SphericalCoord(2, 60, 110).toXYZ());
   uAmbientLightIntensity = 0.3;
   uObjColor = new glColor3([0.5, 0.5, 0.8]);
   uBallRadius = 0.5;
   uEye = new Vec3([0, 0, 0]);
   uTextureSize = 256;
   uRandom = Math.random();
   uRay00 = new Vec3([0, 0, 0]);
   uRay01 = new Vec3([0, 0, 0]);
   uRay10 = new Vec3([0, 0, 0]);
   uRay11 = new Vec3([0, 0, 0]);
   uSample = 0.0;
}

/**
 * Class that does the work of building the Path Traced texture
 */
export class PathTracerRenderer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private vertexBuffer: WebGLBuffer;
   private frameBuffer: glFrameBuffer;
   private textures: glTexture[];
   private toScreenProgram: WebGLProgram;
   private toScreenVertexAttribute: number;
   private toTextureProgram: WebGLProgram;
   private toTextureVertexAttribute: number;
   private analyzer: ColorAnalyzer;
   private tBlock: glUniformBlock;
   private vBlock: glUniformBlock;
   public uniforms = new Uniforms();

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
   ) {

      this.gl = glCtx;
      let gl = this.gl;

      // larger texture is higher resolution, but takes longer to compute
      if (isMobile) {
         this.uniforms.uTextureSize = 256;
      }
      else {
         // this.uniforms.uTextureSize = 512;
         this.uniforms.uTextureSize = 256;
      }
      this.analyzer = new ColorAnalyzer(this.uniforms.uTextureSize);

      // create vertex buffer - the block we'll draw our rendered texture on
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

      // create framebuffer
      this.frameBuffer = new glFrameBuffer(
         gl,
         this.uniforms.uTextureSize,
         this.uniforms.uTextureSize,
      );

      // create two textures. One we display and one we draw to
      this.textures = [];
      for (var i = 0; i < 2; i++) {
         this.textures.push(this.frameBuffer.createTexture(glTextureStyle.Float));
      }

      // create toScreen shader
      this.toScreenProgram = glCompiler.compile(gl, toScreenVertexSource, toScreenFragmentSource);
      this.toScreenVertexAttribute = gl.getAttribLocation(this.toScreenProgram, 'vertex');
      gl.enableVertexAttribArray(this.toScreenVertexAttribute);
   }

   public setObj(tObj: TriangleObj) {
      this.compileShader(tObj);
   }

   public delete() {
      this.frameBuffer.delete();
      this.textures[0].delete();
      this.textures[1].delete();
      if (this.vBlock) {
         this.vBlock.delete();
      }
      if (this.tBlock) {
         this.tBlock.delete();
      }
   }

   private compileShader(tObj?: TriangleObj) {
      let gl = this.gl;

      let p = new Profiler();
      // create the toTexture shader
      if (tObj && tObj.numTriangles > 0) {

         let pObj = new PathTracerObj(tObj);

         this.toTextureProgram = glCompiler.compile(
            gl,
            toTextureVertexSource
               .replace('<VERSION>', '#version 300 es')
               .replace('NOTHING', 'USE_TRIANGLES'),
            toTextureFragmentSource
               .replace('<VERSION>', '#version 300 es')
               .replace('NOTHING', 'USE_TRIANGLES')
               .replace('<NUM_VERTICES>', tObj.numVertices.toString())
               .replace('<NUM_VOLUMES>', pObj.volumes.length.toString())
               .replace('<NUM_TRIANGLES>', tObj.numTriangles.toString())
         );

         // upload triangles to the GPU
         this.uploadUniforms(pObj);
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
   private uploadUniforms(pObj: PathTracerObj) {

      let gl = this.gl as WebGL2RenderingContext;
      let tObj = pObj.tObj;

      // upload the big chunks as Uniform Blocks
      let blockBinding = 2;
      this.vBlock = new glUniformBlock(gl, this.toTextureProgram, 'MyVerticesBlock', blockBinding);

      // put the data into a Float32Array for uploading
      let vData = new Float32Array(pObj.tObj.numVertices * 4);
      for (let i = 0; i < tObj.numVertices; i++) {
         vData[4 * i + 0] = tObj.vertices[3 * i + 0];
         vData[4 * i + 1] = tObj.vertices[3 * i + 1];
         vData[4 * i + 2] = tObj.vertices[3 * i + 2];
         vData[4 * i + 3] = 0;
      }
      this.vBlock.upload(vData);

      blockBinding = 3;
      this.tBlock = new glUniformBlock(gl, this.toTextureProgram, 'MyTrianglesBlock', blockBinding);

      // put the data into a Float32Array for uploading
      let tData = new Int32Array(tObj.numTriangles * 4);
      let index = 0;
      for (let v = 0; v < pObj.volumes.length; v++) {
         let vol = pObj.volumes[v];
         for (let i = 0; i < vol.triangles.length; i++) {
            let t = vol.triangles[i];
            tData[index++] = t.i1;
            tData[index++] = t.i2;
            tData[index++] = t.i3;
            tData[index++] = 0;
         }
      }
      this.tBlock.upload(tData);

      // Upload the volume info as a standard uniform
      let uni = new glUniform(gl, this.toTextureProgram);
      let startIndex = 0;
      for (let i = 0; i < pObj.volumes.length; i++) {
         let vol = pObj.volumes[i];
         uni.set('object.volumes[' + i + '].startIndex', startIndex, true);
         uni.set('object.volumes[' + i + '].numTriangles', vol.triangles.length, true);
         uni.set('object.volumes[' + i + '].boxMin', vol.boxMin);
         uni.set('object.volumes[' + i + '].boxMax', vol.boxMax);
         startIndex += vol.triangles.length;
      }
      uni.set('object.boxMin', tObj.box.min);
      uni.set('object.boxMax', tObj.box.max);
   }

   public get renderMode(): RenderMode {
      return this.mainView;
   }

   public restart(): void {
      this.uniforms.uSample = 0;
   }

   private getEyeRay(matrix: Mat4, x: number, y: number): Vec3 {
      let vec = new Vec4([x, y, 0, 1]);
      return matrix.multV(vec).divideByW().subtract(this.uniforms.uEye);
   }

   public updateTexture(modelviewProjection: Mat4): void {

      let gl = this.gl;

      // implement aliasing by random sampling within a pixel
      let x = (Math.random() * 2 - 1) / this.uniforms.uTextureSize;
      let y = (Math.random() * 2 - 1) / this.uniforms.uTextureSize;
      let z = 0;

      let v = new Vec3([x, y, z]);
      let jitter = Mat4.fromTranslation(v);
      let matrix = jitter.multM(modelviewProjection).inverse();

      this.uniforms.uRay00 = this.getEyeRay(matrix, -1, -1);
      this.uniforms.uRay01 = this.getEyeRay(matrix, -1, +1);
      this.uniforms.uRay10 = this.getEyeRay(matrix, +1, -1);
      this.uniforms.uRay11 = this.getEyeRay(matrix, +1, +1);
      // set uniforms
      let uni = new glUniform(gl, this.toTextureProgram);
      uni.setAll(this.uniforms);

      // render to texture
      gl.viewport(0, 0, this.uniforms.uTextureSize, this.uniforms.uTextureSize);
      this.textures[0].bind();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      this.frameBuffer.bind();
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.textures[1].get(), 0);

      gl.vertexAttribPointer(this.toTextureVertexAttribute, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      let data = this.analyzer.run(gl, this.uniforms.uLightAlpha, this.uniforms.uShadowAlpha);
      this.uniforms.uMaxChroma = data.maxChroma;

      let cr = new ColorRange([data.darkestLightColor.toHtmlColor(), data.avgLightColor.toHtmlColor(), data.lightestLightColor.toHtmlColor()]);
      this.uniforms.uHighlightColor = data.highlightColor;
      this.uniforms.uLightLightColor = cr.get(0.85).toGlColor();
      this.uniforms.uMidLightColor = cr.get(0.5).toGlColor();
      this.uniforms.uDarkLightColor = cr.get(0.15).toGlColor();

      cr = new ColorRange([data.darkestShadowColor.toHtmlColor(), data.avgShadowColor.toHtmlColor(), data.lightestShadowColor.toHtmlColor()]);
      //this.uniforms.uShadowColor = data.terminatorColor;
      this.uniforms.uShadowColor = data.avgShadowColor;
      this.uniforms.uReflectedLightColor = cr.get(1).toGlColor();
      this.uniforms.uDarkAccentColor = cr.get(0.0).toGlColor();

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // ping pong textures
      this.textures.reverse();

      this.uniforms.uSample++;
      this.uniforms.uRandom = Math.random();
   };

   public displayTexture(): void {

      let gl = this.gl;

      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.useProgram(this.toScreenProgram);
      this.textures[0].bind();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.toScreenVertexAttribute, 2, gl.FLOAT, false, 0, 0);

      // display the main screen
      let uni = new glUniform(gl, this.toScreenProgram);
      this.uniforms.uScale = 1.0;
      this.uniforms.uXOffset = 0.0;
      this.uniforms.uYOffset = 0.0;
      this.uniforms.uMode = this.mainView;
      uni.setAll(this.uniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // display the smaller views
      this.uniforms.uScale = 0.2;
      for (let i = 0; i < this.smallViews.length; i++) {
         this.uniforms.uXOffset = 1.0 - (this.smallViews.length - i - 0.5) * (2 * this.uniforms.uScale);
         this.uniforms.uYOffset = 1.0 - this.uniforms.uScale;
         this.uniforms.uMode = this.smallViews[i];
         uni.setAll(this.uniforms);
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

