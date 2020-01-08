import { jsVec3 } from "./jsVec";

interface IUniforms {
   lightIntensity: number,
   lightColor: jsVec3,
   ballColor: jsVec3,
   eye: jsVec3,
   light: jsVec3,
   textureWeight: number,
   timeSinceStart: number,
   sphereCenter0: jsVec3,
   sphereRadius0: number,
   ray00: jsVec3,
   ray01: jsVec3,
   ray10: jsVec3,
   ray11: jsVec3,
   [propName: string]: any
}

export var Uniforms: IUniforms = {
   lightIntensity: 0.8,
   lightColor: new jsVec3([1.0, 1.0, 1.0]),
   ballColor: new jsVec3([0.5, 0.5, 0.8]),
   eye: new jsVec3([0, 0, 0]),
   light: new jsVec3([-0.4, 0.5, 0.6]), // SAW light position
   textureWeight: 0,
   timeSinceStart: 0,
   sphereCenter0: new jsVec3([0, -0.5, 0]),
   sphereRadius0: 0.5,
   ray00: new jsVec3([0,0,0]),
   ray01: new jsVec3([0,0,0]),
   ray10: new jsVec3([0,0,0]),
   ray11: new jsVec3([0,0,0]),
}


