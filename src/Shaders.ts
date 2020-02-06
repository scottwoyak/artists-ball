import { glVec3, glVec4 } from "./glVec";
import { glMat4 } from "./glMat";
import { gl } from "./index";
import { glColor } from "./glColor";

/**
 * Types for the uniform values
 */
interface IUniforms {
   uLightIntensity: number,
   uLightColor: glColor,
   uLightPos: glVec3,
   uAmbientLightIntensity: number,
   uBallColor: glColor,
   uEye: glVec3,
   uTextureSize: number,
   uTextureWeight: number,
   uTimeSinceStart: number,
   uRay00: glVec3,
   uRay01: glVec3,
   uRay10: glVec3,
   uRay11: glVec3,
   uPass: number,
   uSample: number,
   uNumPasses: number,
   [propName: string]: any
}

/**
 * Values that are passed to the shader
 */
export var Uniforms: IUniforms = {
   uLightIntensity: 0.7,
   uLightColor: new glColor([1.0, 1.0, 1.0]),
   uLightPos: new glVec3([-0.6, 0.7, 0.8]),
   uAmbientLightIntensity: 0.3,
   uBallColor: new glColor([0.5, 0.5, 0.8]),
   uEye: new glVec3([0, 0, 0]),
   uTextureSize: 256,
   uTextureWeight: 0,
   uTimeSinceStart: 0,
   uRay00: new glVec3([0, 0, 0]),
   uRay01: new glVec3([0, 0, 0]),
   uRay10: new glVec3([0, 0, 0]),
   uRay11: new glVec3([0, 0, 0]),
   uPass: 0.0,
   uNumPasses: 1.0,
   uSample: 0.0,
}

export class Shaders {

   public static getEyeRay(matrix: glMat4, x: number, y: number): glVec3 {
      let vec = new glVec4([x, y, 0, 1]);
      return matrix.multV(vec).divideByW().subtract(Uniforms.uEye);
   }

   public static setUniforms(program: WebGLProgram, uniforms: any) {
      for (var name in uniforms) {
         var value = uniforms[name];
         var location = gl.getUniformLocation(program, name);
         if (location == null) continue;
         else if (value instanceof glVec3) {
            gl.uniform3fv(location, new Float32Array([value.get(0), value.get(1), value.get(2)]));
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

