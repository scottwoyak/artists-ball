
/*
 WebGL Path Tracing (http://madebyevan.com/webgl-path-tracing/)
 License: MIT License (see below)

 Copyright (c) 2010 Evan Wallace

 Permission is hereby granted, free of charge, to any person
 obtaining a copy of this software and associated documentation
 files (the "Software"), to deal in the Software without
 restriction, including without limitation the rights to use,
 copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the
 Software is furnished to do so, subject to the following
 conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 OTHER DEALINGS IN THE SOFTWARE.
*/



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
}

/**
 * Values that are passed to the shader
 */
let ToScreenUniforms: IToScreenUniforms = {
   uScale: 1.0,
   uXOffset: 0.0,
   uYOffset: 0.0,
   uMode: 0,
}

export class PathTracer {

   private vertexBuffer: WebGLBuffer;

   private frameBuffer: WebGLFramebuffer;
   private textures: WebGLTexture[];
   private renderProgram: WebGLProgram;
   private renderVertexAttribute: number;
   private sampleCount: number;
   private tracerProgram: WebGLProgram;
   private tracerVertexAttribute: number;

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

      // create textures
      gl.getExtension('EXT_color_buffer_float');

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
            gl.RGBA32F,             // internal format
            Uniforms.uTextureSize,  // width
            Uniforms.uTextureSize,  // height
            0,                      // border
            gl.RGBA,                // format
            gl.FLOAT,               // type
            null                    // pixels
         );
      }
      gl.bindTexture(gl.TEXTURE_2D, null);

      // create render shader
      this.renderProgram = Shaders.compileShader(toScreenVertexSource, toScreenFragmentSource);
      this.renderVertexAttribute = gl.getAttribLocation(this.renderProgram, 'vertex');
      gl.enableVertexAttribArray(this.renderVertexAttribute);

      this.sampleCount = 0;
      this.tracerProgram = Shaders.compileShader(toTextureVertexSource, toTextureFragmentSource);
      this.tracerVertexAttribute = gl.getAttribLocation(this.tracerProgram, 'vertex');
      gl.enableVertexAttribArray(this.tracerVertexAttribute);
   };

   public restart(): void {
      this.sampleCount = 0;
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
      Uniforms.uTextureWeight = this.sampleCount / (this.sampleCount + 1);

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
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // ping pong textures
      this.textures.reverse();
      this.sampleCount++;
   };

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
      ToScreenUniforms.uMode = RenderMode.Color;
      Shaders.setUniforms(this.renderProgram, ToScreenUniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // display the chroma view
      ToScreenUniforms.uScale = 0.2;
      ToScreenUniforms.uXOffset = 0.4;
      ToScreenUniforms.uYOffset = 0.8;
      ToScreenUniforms.uMode = RenderMode.Chroma;
      Shaders.setUniforms(this.renderProgram, ToScreenUniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // display the color view
      ToScreenUniforms.uScale = 0.2;
      ToScreenUniforms.uXOffset = 0.8;
      ToScreenUniforms.uYOffset = 0.8;
      ToScreenUniforms.uMode = RenderMode.Value;
      Shaders.setUniforms(this.renderProgram, ToScreenUniforms);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   }
}

