import { glTexture, glTextureStyle } from './glTexture';

/**
 * Lightweight WebGL wrapper for a framebuffer
 */
export class glFrameBuffer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext;
   private frameBuffer: WebGLFramebuffer | null;
   public readonly width: number;
   public readonly height: number;

   /**
    * Gets the larger of the width or height
    */
   public get size(): number {
      return Math.max(this.width, this.height);
   }

   /**
    * Create a frame buffer
    * 
    * @param glCtx The WebGL context
    * @param width The width (in pixels) of the rendering (must be power of 2)
    * @param height The height (in pixels) of the rendering (must be power of 2)
    */
   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      width: number,
      height: number,
   ) {

      this.gl = glCtx;
      this.width = width;
      this.height = height;

      const gl = this.gl;
      this.frameBuffer = gl.createFramebuffer();
   }

   public dispose(): void {
      const gl = this.gl;

      if (this.frameBuffer) {
         gl.deleteFramebuffer(this.frameBuffer);
         this.frameBuffer = null;
      }
   }

   public get(): WebGLFramebuffer | null {
      return this.frameBuffer;
   }

   public bind(): void {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
   }

   public createTexture(style: glTextureStyle): glTexture {
      return new glTexture(this.gl, this.width, this.height, style);
   }

   public attachTexture(attachment: number, texture: WebGLTexture | glTexture): void {

      if (texture instanceof glTexture) {
         texture = texture.get();
      }

      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
      gl.framebufferTexture2D(
         gl.FRAMEBUFFER,
         attachment,
         gl.TEXTURE_2D,
         texture,
         0
      );
   }

   public check(): void {
      const gl = this.gl;
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
         const msg = 'The created frame buffer is invalid: ' + status.toString();
         alert(msg);
         console.log(msg);
      }
   }
}