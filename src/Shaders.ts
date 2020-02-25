import { glVec3 } from "./glVec";
import { glColor } from "./glColor";
import { gl } from "./app";

export class Shaders {

   public static setUniforms(program: WebGLProgram, uniforms: any) {
      for (var name in uniforms) {
         var value = uniforms[name];
         var location = gl.getUniformLocation(program, name);
         if (location == null) continue;
         else if (value instanceof glVec3) {
            gl.uniform3fv(location, new Float32Array(value.values));
         }
         else if (value instanceof glColor) {
            gl.uniform3fv(location, new Float32Array([value.r, value.g, value.b]));
         }
         else if (name === "uMode") {
            gl.uniform1i(location, value);
         }
         else {
            gl.uniform1f(location, value);
         }
      }
   }

   public static compileSource(source: string, type: number) {
      var shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
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

