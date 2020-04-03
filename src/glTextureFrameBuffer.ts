export enum FrameBufferStyle {
   Normal,
   Depth,
   Float
}

/**
 * A frame buffer that can be rendered to
 */
export class glTextureFrameBuffer {

   private gl: WebGLRenderingContext | WebGL2RenderingContext = null;
   public frameBuffer: WebGLFramebuffer;
   public colorTexture: WebGLTexture;
   public depthTexture: WebGLTexture;

   /**
    * Create a frame buffer for rendering into texture objects.
    * 
    * @param glCtx The WebGL context
    * @param width The width (in pixels) of the rendering (must be power of 2)
    * @param height The height (in pixels) of the rendering (must be power of 2)
    */
   public constructor(
      glCtx: WebGLRenderingContext | WebGL2RenderingContext,
      width: number,
      height: number,
      style: FrameBufferStyle
   ) {

      this.gl = glCtx;

      switch (style) {
         case FrameBufferStyle.Normal:
            this.create(width, height);
            break;

         case FrameBufferStyle.Depth:
            this.createDepth(width, height);
            break;

         case FrameBufferStyle.Float:
            this.createFloat(width, height);
            break;
      }
   }

   public delete() {
      let gl = this.gl;

      if (this.depthTexture) {
         gl.deleteTexture(this.depthTexture);
         this.depthTexture = null;
      }
      if (this.colorTexture) {
         gl.deleteTexture(this.colorTexture);
         this.colorTexture = null;
      }
      if (this.frameBuffer) {
         gl.deleteFramebuffer(this.frameBuffer);
         this.frameBuffer = null;
      }
   }

   private create(width: number, height: number) {

      let gl = this.gl;

      // Step 1: Create a frame buffer object
      this.frameBuffer = gl.createFramebuffer();

      // Step 2: Create and initialize a texture buffer to hold the colors.
      this.colorTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
         gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Step 4: Attach the specific buffers to the frame buffer.
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);

      // Step 5: Verify that the frame buffer is valid.
      let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
         let msg = "The created frame buffer is invalid: " + status.toString();
         alert(msg);
         console.log(msg);
      }

      // Unbind these new objects, which makes the default frame buffer the
      // target for rendering.
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   }

   private createDepth(width: number, height: number) {
      let gl = this.gl;

      let depth_texture_extension = gl.getExtension('WEBGL_depth_texture');
      if (!depth_texture_extension) {
         alert('This WebGL program requires the use of the WEBGL_depth_texture extension.');
         return;
      }

      // Step 1: Create a frame buffer object
      this.frameBuffer = gl.createFramebuffer();

      // Step 2: Create and initialize a texture buffer to hold the colors.
      this.colorTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0,
         gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Step 3: Create and initialize a texture buffer to hold the depth values.
      // Note: the WEBGL_depth_texture extension is required for this to work
      //       and for the gl.DEPTH_COMPONENT texture format to be supported.
      this.depthTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.depthTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, width, height, 0,
         gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      // Step 4: Attach the specific buffers to the frame buffer.
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, this.depthTexture, 0);

      // Step 5: Verify that the frame buffer is valid.
      let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (status !== gl.FRAMEBUFFER_COMPLETE) {
         let msg = "The created frame buffer is invalid: " + status.toString();
         alert(msg);
         console.log(msg);
      }

      // Unbind these new objects, which makes the default frame buffer the
      // target for rendering.
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   }

   public createFloat(width: number, height: number) {
   }
}