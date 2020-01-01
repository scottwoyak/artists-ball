////////////////////////////////////////////////////////////////////////////////
// class PathTracer
////////////////////////////////////////////////////////////////////////////////

import { gl } from './app';
import { Shaders } from './Shaders';
import { Matrix } from './Matrix';
import { Uniforms } from "./Uniforms";


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
      //   gl.getExtension('EXT_color_buffer_float');   
      type = gl.UNSIGNED_BYTE;
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

   public restart() : void {
      this.sampleCount = 0;
   }

   public update(matrix: Matrix, timeSinceStart: number): void {

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

