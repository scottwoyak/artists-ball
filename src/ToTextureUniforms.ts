import { glColor } from "./glColor";
import { glVec3 } from "./glVec";

/**
 * Types for the uniform values
 */
export interface IToTextureUniforms {
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
   uBALL_SPECULAR: number;
   uBALL_LIGHT: number;
   uBALL_SHADOW: number;
   [propName: string]: any
}

/**
 * Values that are passed to the shader
 */
export var ToTextureUniforms: IToTextureUniforms = {
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
   uBALL_SPECULAR: 1002,
   uBALL_LIGHT: 1001,
   uBALL_SHADOW: 1000,
}
