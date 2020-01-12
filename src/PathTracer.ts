
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
      // create vertex buffer
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);

      // create framebuffer
      this.frameBuffer = gl.createFramebuffer();

      // create textures
      var type = gl.getExtension('OES_texture_float') ? gl.FLOAT : gl.UNSIGNED_BYTE;
      gl.getExtension('EXT_color_buffer_float');
      //      type = gl.UNSIGNED_BYTE;
      type = gl.FLOAT;
      this.textures = [];
      for (var i = 0; i < 2; i++) {
         this.textures.push(gl.createTexture());
         gl.bindTexture(gl.TEXTURE_2D, this.textures[i]);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 512, 512, 0, gl.RGB, type, null);
      }
      gl.bindTexture(gl.TEXTURE_2D, null);
      //   gl.viewport(0, 0, 300, 300);

      // create render shader
      this.renderProgram = Shaders.compileShader(Shaders.renderVertexSource, Shaders.renderFragmentSource);
      this.renderVertexAttribute = gl.getAttribLocation(this.renderProgram, 'vertex');
      gl.enableVertexAttribArray(this.renderVertexAttribute);

      this.sampleCount = 0;
      this.tracerProgram = Shaders.compileShader(Shaders.tracerVertexSource, Shaders.makeTracerFragmentSource());
      this.tracerVertexAttribute = gl.getAttribLocation(this.tracerProgram, 'vertex');
      gl.enableVertexAttribArray(this.tracerVertexAttribute);
   };

   public restart(): void {
      this.sampleCount = 0;
   }

   public update(modelviewProjection: glMat4, timeSinceStart: number): void {

      let x = Math.random() * 2 - 1;
      let y = Math.random() * 2 - 1;
      let z = 0;

      let size = 512.0;
      let v = new glVec3([x / size, y / size, z / size]);
      let jitter = glMat4.fromTranslation(v);
      let matrix = jitter.multM(modelviewProjection).invert();

      Uniforms.ray00 = Shaders.getEyeRay(matrix, -1, -1);
      Uniforms.ray01 = Shaders.getEyeRay(matrix, -1, +1);
      Uniforms.ray10 = Shaders.getEyeRay(matrix, +1, -1);
      Uniforms.ray11 = Shaders.getEyeRay(matrix, +1, +1);
      Uniforms.timeSinceStart = timeSinceStart;
      Uniforms.textureWeight = this.sampleCount / (this.sampleCount + 1);

      // set uniforms
      gl.useProgram(this.tracerProgram);
      Shaders.setUniforms(this.tracerProgram);

      // render to texture
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

   public render(): void {
      gl.useProgram(this.renderProgram);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[0]);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.vertexAttribPointer(this.renderVertexAttribute, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
   }
}

