import { RenderMode } from "./PathTracerRenderer";
import { glColor3 } from "./glColor";
import { Vec3 } from "./Vec";
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

   uHighlightColor: glColor3;
   uLightLightColor: glColor3;
   uMidLightColor: glColor3;
   uDarkLightColor: glColor3;

   uShadowColor: glColor3;
   uReflectedLightColor: glColor3;
   uDarkAccentColor: glColor3;

   uLightAlpha: number;
   uShadowAlpha: number;

   uLightIntensity: number,
   uLightColor: glColor3,
   uLightPos: Vec3,
   uAmbientLightIntensity: number,
   uObjColor: glColor3,
   uBallRadius: number,
   uEye: Vec3,
   uTextureSize: number,
   uRandom: number,
   uRay00: Vec3,
   uRay01: Vec3,
   uRay10: Vec3,
   uRay11: Vec3,
   uSample: number,
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

   uHighlightColor: undefined,
   uLightLightColor: undefined,
   uMidLightColor: undefined,
   uDarkLightColor: undefined,

   uShadowColor: undefined,
   uReflectedLightColor: undefined,
   uDarkAccentColor: undefined,

   uLightAlpha: 1001,
   uShadowAlpha: 1000,

   uLightIntensity: 0.7,
   uLightColor: new glColor3([1.0, 1.0, 1.0]),
   uLightPos: new Vec3(new SphericalCoord(2, 60, 110).toXYZ()),
   uAmbientLightIntensity: 0.3,
   uObjColor: new glColor3([0.5, 0.5, 0.8]),
   uBallRadius: 0.5,
   uEye: new Vec3([0, 0, 0]),
   uTextureSize: 256,
   uRandom: Math.random(),
   uRay00: new Vec3([0, 0, 0]),
   uRay01: new Vec3([0, 0, 0]),
   uRay10: new Vec3([0, 0, 0]),
   uRay11: new Vec3([0, 0, 0]),
   uSample: 0.0,
}
