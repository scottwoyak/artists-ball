import { glVec3 } from "./glVec";

interface IUniforms {
   lightIntensity: number,
   lightColor: glVec3,
   ballColor: glVec3,
   eye: glVec3,
   light: glVec3,
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

export var Uniforms: IUniforms = {
   lightIntensity: 0.8,
   lightColor: new glVec3([1.0, 1.0, 1.0]),
   ballColor: new glVec3([0.5, 0.5, 0.8]),
   eye: new glVec3([0, 0, 0]),
   light: new glVec3([-0.4, 0.5, 0.6]), // SAW light position
   textureWeight: 0,
   timeSinceStart: 0,
   sphereCenter0: new glVec3([0, -0.5, 0]),
   sphereRadius0: 0.5,
   ray00: new glVec3([0,0,0]),
   ray01: new glVec3([0,0,0]),
   ray10: new glVec3([0,0,0]),
   ray11: new glVec3([0,0,0]),
}


