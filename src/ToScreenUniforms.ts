import { RenderMode } from "./PathTracer";
import { glColor } from "./glColor";
import { ToTextureUniforms } from "./ToTextureUniforms";

/**
 * Types for the uniform values
 */
export interface IToScreenUniforms {
   uScale: number;
   uXOffset: number;
   uYOffset: number;
   uMode: RenderMode;
   uMaxChroma: number;
   uBallLightChroma: number;
   uBallShadowChroma: number;
   uBallLightShift: number;
   uBallShadowShift: number;

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
}

/**
 * Values that are passed to the shader
 */
export let ToScreenUniforms: IToScreenUniforms = {
   uScale: 1.0,
   uXOffset: 0.0,
   uYOffset: 0.0,
   uMode: 0,
   uMaxChroma: 1.0,
   uBallLightChroma: 1.0,
   uBallShadowChroma: 1.0,
   uBallLightShift: 0.0,
   uBallShadowShift: 0.0,

   uHighlightColor: undefined,
   uLightLightColor: undefined,
   uMidLightColor: undefined,
   uDarkLightColor: undefined,

   uShadowColor: undefined,
   uReflectedLightColor: undefined,
   uDarkAccentColor: undefined,

   uBALL_SPECULAR: ToTextureUniforms.uBALL_SPECULAR,
   uBALL_LIGHT: ToTextureUniforms.uBALL_LIGHT,
   uBALL_SHADOW: ToTextureUniforms.uBALL_SHADOW,
}

