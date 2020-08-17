export enum glTextureStyle {
   Color,
   Depth,
   Float
}

/**
 * Lightweight WebGL wrapper for a texture
 */
export class glTexture {

   private gl: WebGLRenderingContext | WebGL2RenderingContext;
   public texture: WebGLTexture | undefined;
   public readonly width: number;
   public readonly height: number;

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
      style: glTextureStyle
   ) {

      this.gl = glCtx;
      this.width = width;
      this.height = height;

      switch (style) {
         case glTextureStyle.Color:
            this.createColor(width, height);
            break;

         case glTextureStyle.Depth:
            this.createDepth(width, height);
            break;

         case glTextureStyle.Float:
            this.createFloat(width, height);
            break;
      }
   }

   public dispose(): void {
      const gl = this.gl;

      if (this.texture) {
         gl.deleteTexture(this.texture);
         this.texture = null;
      }
   }

   private createColor(width: number, height: number) {

      const gl = this.gl;

      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      gl.texImage2D(
         gl.TEXTURE_2D,          // target
         0,                      // level
         gl.RGBA,                // internal format
         width,                  // width
         height,                 // height
         0,                      // border
         gl.RGBA,                // format
         gl.UNSIGNED_BYTE,       // type
         null                    // pixels
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   }

   private createDepth(width: number, height: number) {
      const gl = this.gl;

      const depth_texture_extension = gl.getExtension('WEBGL_depth_texture');
      if (!depth_texture_extension) {
         alert('This WebGL program requires the use of the WEBGL_depth_texture extension.');
         return;
      }

      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      gl.texImage2D(
         gl.TEXTURE_2D,          // target
         0,                      // level
         gl.DEPTH_COMPONENT,     // internal format
         width,                  // width
         height,                 // height
         0,                      // border
         gl.DEPTH_COMPONENT,     // format
         gl.UNSIGNED_INT,        // type
         null                    // pixels
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   }

   private createFloat(width: number, height: number) {
      const gl = this.gl;

      let internalFormat: number;
      let format: number;
      let type: number;

      // create textures
      if (gl instanceof WebGLRenderingContext) {
         const ext = gl.getExtension('OES_texture_half_float');
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
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

      gl.texImage2D(
         gl.TEXTURE_2D,          // target
         0,                      // level
         internalFormat,         // internal format
         width,                  // width
         height,                 // height
         0,                      // border
         format,                 // format
         type,                   // type
         null                    // pixels
      );
      gl.bindTexture(gl.TEXTURE_2D, null);
   }

   public get(): WebGLTexture {
      return this.texture;
   }

   public bind() {
      let gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
   }
}
