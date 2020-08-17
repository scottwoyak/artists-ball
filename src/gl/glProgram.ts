/**
 * Utility wrapper for compiling WebGL shader programs
 */
export class glProgram {

   private gl: WebGLRenderingContext | WebGL2RenderingContext;
   private program: WebGLProgram;

   /**
    * Compiles and links vertex and fragment shaders into a program
    *
    * @param gl The WebGL context
    * @param vertexSource Vertex shader source
    * @param fragmentSource Fragment shader source
    * @returns the program id
    * @throws if the compilation fails
    */
   public constructor(gl: WebGLRenderingContext | WebGL2RenderingContext,
      vertexSource: string,
      fragmentSource: string
   ) {
      this.gl = gl;
      this.compile(vertexSource, fragmentSource);
   }

   /**
    * Gets the underlying WebGLProgram
    * 
    * @return the WebGLProgram
    */
   public get(): WebGLProgram {
      return this.program;
   }

   /**
    * Calls useProgram() for this program
    */
   public use(): void {
      const gl = this.gl;
      gl.useProgram(this.program);
   }

   /**
    * Compiles a shader program
    *
    * @param gl The WebGL context 
    * @param source The source code
    * @param type The shader type
    * @throws if the compilation fails
    */
   private compileShader(
      source: string,
      type: number
   ) {
      const gl = this.gl;

      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
         console.log(source);
         const err = gl.getShaderInfoLog(shader);
         console.error(err);
         throw 'compile error: ' + err;
      }
      return shader;
   }

   public dispose(): void {
      const gl = this.gl;
      gl.deleteProgram(this.program);
      this.program = null;
   }

   /**
    * Compiles and links vertex and fragment shaders into a program
    * 
    * @param vertexSource Vertex shader source
    * @param fragmentSource Fragment shader source
    * @returns the program id
    * @throws if the compilation fails
    */
   private compile(
      vertexSource: string,
      fragmentSource: string
   ) {

      const gl = this.gl;
      this.program = gl.createProgram();
      gl.attachShader(this.program, this.compileShader(vertexSource, gl.VERTEX_SHADER));
      gl.attachShader(this.program, this.compileShader(fragmentSource, gl.FRAGMENT_SHADER));
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
         const err = gl.getProgramInfoLog(this.program);
         console.error(err);
         throw 'link error: ' + err;
      }
   }
}