import { gl } from "./app";

export class Shaders {

   public static compileSource(source: string, type: number) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
         console.log(source);
         throw 'compile error: ' + gl.getShaderInfoLog(shader);
      }
      return shader;
   }

   public static compileShader(vertexSource: string, fragmentSource: string) {
      var shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, Shaders.compileSource(vertexSource, gl.VERTEX_SHADER));
      gl.attachShader(shaderProgram, Shaders.compileSource(fragmentSource, gl.FRAGMENT_SHADER));
      gl.linkProgram(shaderProgram);
      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
         throw 'link error: ' + gl.getProgramInfoLog(shaderProgram);
      }
      return shaderProgram;
   }
}

