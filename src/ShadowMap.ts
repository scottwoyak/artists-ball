import { gl } from "./Globals";

export class ShadowMap {

   public frameBuffer: WebGLFramebuffer;
   public colorTexture: WebGLTexture;
   public depthTexture: WebGLTexture;

   /**
    * Create a frame buffer for rendering into texture objects.
    * 
    * @param width The width (in pixels) of the rendering (must be power of 2)
    * @param height The height (in pixels) of the rendering (must be power of 2)
    */
   public constructor(width: number, height: number) {

      let depth_texture_extension = gl.getExtension('WEBGL_depth_texture');
      if (!depth_texture_extension) {
         console.log('This WebGL program requires the use of the ' +
            'WEBGL_depth_texture extension. This extension is not supported ' +
            'by your browser, so this WEBGL program is terminating.');
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
         console.log("The created frame buffer is invalid: " + status.toString());
      }

      // Unbind these new objects, which makes the default frame buffer the
      // target for rendering.
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   }
}