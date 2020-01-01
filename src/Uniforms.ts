import { Vector } from "./Vector";

export var Uniforms: any = {
   lightIntensity: 0.8,
   lightColor: new Vector([1.0, 1.0, 1.0]),
   ballColor: new Vector([0.5, 0.5, 0.8]),
   eye: new Vector([0, 0, 0]),
   light: new Vector([-0.4, 0.5, 0.6]), // SAW light position
   textureWeight: 0,
   timeSinceStart: 0,
   texture: WebGLTexture,
   sphereCenter0: new Vector([0, -0.5, 0]),
   sphereRadius0: 0.5,
   ray00: Vector,
   ray01: Vector,
   ray10: Vector,
   ray11: Vector,
}

