import { glVec3, glVec4 } from "./glVec";
import { glMat4 } from "./glMat";
import { gl } from "./index";

/**
 * Types for the uniform values
 */
interface IUniforms {
   lightIntensity: number,
   lightColor: glVec3,
   ballColor: glVec3,
   eye: glVec3,
   light: glVec3,
   textureSize: number,
   textureWeight: number,
   timeSinceStart: number,
   sphereCenter0: glVec3,
   sphereRadius0: number,
   ray00: glVec3,
   ray01: glVec3,
   ray10: glVec3,
   ray11: glVec3,
   [propName: string]: any
}

/**
 * Values that are passed to the shader
 */
export var Uniforms: IUniforms = {
   lightIntensity: 0.8,
   lightColor: new glVec3([1.0, 1.0, 1.0]),
   ballColor: new glVec3([0.5, 0.5, 0.8]),
   eye: new glVec3([0, 0, 0]),
   light: new glVec3([-0.4, 0.5, 0.6]), // SAW light position
   textureSize: 1024,
   textureWeight: 0,
   timeSinceStart: 0,
   sphereCenter0: new glVec3([0, -0.5, 0]),
   sphereRadius0: 0.5,
   ray00: new glVec3([0, 0, 0]),
   ray01: new glVec3([0, 0, 0]),
   ray10: new glVec3([0, 0, 0]),
   ray11: new glVec3([0, 0, 0]),
}

export class Shaders {


   public static getEyeRay(matrix: glMat4, x: number, y: number): glVec3 {
      let vec = new glVec4([x, y, 0, 1]);
      return matrix.multV(vec).divideByW().subtract(Uniforms.eye);
   }

   public static setUniforms(program: WebGLProgram) {
      for (var name in Uniforms) {
         var value = Uniforms[name];
         var location = gl.getUniformLocation(program, name);
         if (location == null) continue;
         else if (value instanceof glVec3) {
            gl.uniform3fv(location, new Float32Array([value.get(0), value.get(1), value.get(2)]));
         } else {
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

