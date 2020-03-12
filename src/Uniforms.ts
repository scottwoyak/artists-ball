import { RenderMode } from "./PathTracer";
import { glColor } from "./glColor";
import { glVec3 } from "./glVec";
import { SphericalCoord } from "./SphericalCoord";

/**
 * Types for the uniform values
 */
export interface IUniforms {
   uScale: number;
   uXOffset: number;
   uYOffset: number;
   uMode: RenderMode;
   uMaxChroma: number;

   uBallLightShift: number;
   uBallLightTintStrength: number;

   uBallShadowShift: number;
   uBallShadowTintStrength: number;

   uHighlightColor: glColor;
   uLightLightColor: glColor;
   uMidLightColor: glColor;
   uDarkLightColor: glColor;

   uShadowColor: glColor;
   uReflectedLightColor: glColor;
   uDarkAccentColor: glColor;

   uBALL_SPECULAR: number;
   uBALL_LIGHT: number;
   uBALL_SHADOW: number;

   uLightIntensity: number,
   uLightColor: glColor,
   uLightPos: glVec3,
   uAmbientLightIntensity: number,
   uBallColor: glColor,
   uBallRadius: number,
   uEye: glVec3,
   uTextureSize: number,
   uRandom: number,
   uRay00: glVec3,
   uRay01: glVec3,
   uRay10: glVec3,
   uRay11: glVec3,
   uSample: number,
   uPixel: number,
}

/**
 * Values that are passed to the shader
 */
export let Uniforms: IUniforms = {
   uScale: 1.0,
   uXOffset: 0.0,
   uYOffset: 0.0,
   uMode: 0,
   uMaxChroma: 1.0,

   uBallLightShift: 0.0,
   uBallLightTintStrength: 0.5,

   uBallShadowShift: 0.0,
   uBallShadowTintStrength: 0.5,

   uHighlightColor: undefined,
   uLightLightColor: undefined,
   uMidLightColor: undefined,
   uDarkLightColor: undefined,

   uShadowColor: undefined,
   uReflectedLightColor: undefined,
   uDarkAccentColor: undefined,

   uBALL_SPECULAR: 1002,
   uBALL_LIGHT: 1001,
   uBALL_SHADOW: 1000,

   uLightIntensity: 0.7,
   uLightColor: new glColor([1.0, 1.0, 1.0]),
   uLightPos: new glVec3(new SphericalCoord(2, 60, 110).toXYZ()),
   uAmbientLightIntensity: 0.3,
   uBallColor: new glColor([0.5, 0.5, 0.8]),
   uBallRadius: 0.5,
   uEye: new glVec3([0, 0, 0]),
   uTextureSize: 256,
   uRandom: Math.random(),
   uRay00: new glVec3([0, 0, 0]),
   uRay01: new glVec3([0, 0, 0]),
   uRay10: new glVec3([0, 0, 0]),
   uRay11: new glVec3([0, 0, 0]),
   uSample: 0.0,
   uPixel: 0.0,
}
