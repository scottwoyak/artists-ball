import { gl } from "./app";

/**
 * Utility wrapper for compiling WebGL shader programs
 */
export class glCompiler {

   /**
    * use static functions only
    */
   private constructor() {
   }

   /**
    * Compiles a shader program
    * 
    * @param source The source code
    * @param type The shader type
    * @throws if the compilation fails
    */
   private static compileShader(source: string, type: number) {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
         console.log(source);
         throw 'compile error: ' + gl.getShaderInfoLog(shader);
      }
      return shader;
   }

   /**
    * Compiles and links vertex and fragment shaders into a program
    * 
    * @param vertexSource Vertex shader source
    * @param fragmentSource Fragment shader source
    * @returns the program id
    * @throws if the compilation fails
    */
   public static compile(vertexSource: string, fragmentSource: string) {
      let program = gl.createProgram();
      gl.attachShader(program, glCompiler.compileShader(vertexSource, gl.VERTEX_SHADER));
      gl.attachShader(program, glCompiler.compileShader(fragmentSource, gl.FRAGMENT_SHADER));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
         throw 'link error: ' + gl.getProgramInfoLog(program);
      }
      return program;
   }
}