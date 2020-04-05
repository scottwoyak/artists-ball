import { glTexture, glTextureStyle } from "./glTexture";

/**
 * Lightweight WebGL wrapper for a framebuffer
 */
export class glFrameBuffer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   private frameBuffer: WebGLFramebuffer;
   public readonly width: number;
   public readonly height: number;

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

      let gl = this.gl;
      this.frameBuffer = gl.createFramebuffer();
   }

   public delete() {
      let gl = this.gl;

      if (this.frameBuffer) {
         gl.deleteFramebuffer(this.frameBuffer);
         this.frameBuffer = null;
      }
   }

   public get(): WebGLFramebuffer {
      return this.frameBuffer;
   }

   public bind() {
      let gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
   }

   public createTexture(style: glTextureStyle): glTexture {
      return new glTexture(this.gl, this.width, this.height, style);
   }

   public attachTexture(attachment: number, texture: WebGLTexture | glTexture) {

      if (texture instanceof glTexture) {
         texture = texture.get();
      }

      let gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
      gl.framebufferTexture2D(
         gl.FRAMEBUFFER,
         attachment,
         gl.TEXTURE_2D,
         texture,
         0
      );
   }

   public check() {
      let gl = this.gl;
      let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
         let msg = "The created frame buffer is invalid: " + status.toString();
         alert(msg);
         console.log(msg);
      }
   }
}