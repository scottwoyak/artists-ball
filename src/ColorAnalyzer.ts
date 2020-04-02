import { glColor } from "./glColor";

/**
 * The items returned from examining the current view
 */
export interface IColorData {
   maxChroma: number,
   highlightColor: glColor,
   avgLightColor: glColor,
   lightestLightColor: glColor,
   darkestLightColor: glColor,
   avgShadowColor: glColor,
   lightestShadowColor: glColor,
   darkestShadowColor: glColor,
   terminatorColor: glColor,
}

/**
 * This class grabs a copy of the rendered texture and examines it for
 * color values.
 */
export class ColorAnalyzer {

   /**
    * The array where we'll dump the texture to. Cache this array instead of
    * allocating a new one for each frame.
    */
   private pixels: Float32Array;

   /**
    * Size of the texture
    */
   private readonly size: number;

   /**
    * @param size The width and height of the buffer
    */
   public constructor(size: number) {

      this.size = size;

      // allocate the buffer used for grabs
      this.pixels = new Float32Array(this.size * this.size * 4);
   }

   /**
    * Runs the analysis - grabs a copy of the frame buffer and scans it.
    * 
    * @param alphaLight The alpha value for things in light. Values above this are due to specular lighting.
    * @param alphaShadow The alpha value for things in shadow.
    */
   public run(
      gl: WebGLRenderingContext | WebGL2RenderingContext,
      alphaLight: number,
      alphaShadow: number
   ): IColorData {

      let data: IColorData = {
         maxChroma: 0,
         avgLightColor: new glColor([0, 0, 0]),
         lightestLightColor: new glColor([0, 0, 0]),
         darkestLightColor: new glColor([1, 1, 1]),
         avgShadowColor: new glColor([0, 0, 0]),
         lightestShadowColor: new glColor([0, 0, 0]),
         darkestShadowColor: new glColor([1, 1, 1]),
         terminatorColor: new glColor([0, 0, 0]),
         highlightColor: new glColor([0, 0, 0]),
      }

      // TODO handle case when the text type is UNSIGNED_BYTE
      gl.readPixels(0, 0, this.size, this.size, gl.RGBA, gl.FLOAT, this.pixels);

      let numLightPixels = 0;
      let numShadowPixels = 0;
      let numTerminatorPixels = 0;

      for (let row = 0; row < this.size; row++) {
         for (let col = 0; col < this.size; col++) {
            let index = (row * this.size + col) * 4;
            let r = this.pixels[index + 0];
            let g = this.pixels[index + 1];
            let b = this.pixels[index + 2];
            let a = this.pixels[index + 3];

            // ignore values that are not part of the ball
            if (a === 1) {
               continue;
            }

            let avg = (r + g + b) / 3;
            let chroma = (Math.abs(r - avg) + Math.abs(g - avg) + Math.abs(b - avg)) / (4 / 3);

            if (chroma > data.maxChroma) {
               data.maxChroma = chroma;
            }

            let color = new glColor([r, g, b]);
            if (a == alphaLight) {
               numLightPixels++;
               if (data.lightestLightColor == null) {
                  data.lightestLightColor = color;
               }
               if (data.darkestLightColor == null) {
                  data.darkestLightColor = color;
               }
               data.lightestLightColor = glColor.lightest(data.lightestLightColor, color);
               data.darkestLightColor = glColor.darkest(data.darkestLightColor, color);
               data.avgLightColor.r += color.r;
               data.avgLightColor.b += color.b;
               data.avgLightColor.g += color.g;
            }
            else if (a == alphaShadow) {
               numShadowPixels++;
               if (data.lightestShadowColor == null) {
                  data.lightestShadowColor = color;
               }
               if (data.darkestShadowColor == null) {
                  data.darkestShadowColor = color;
               }
               data.lightestShadowColor = glColor.lightest(data.lightestShadowColor, color);
               data.darkestShadowColor = glColor.darkest(data.darkestShadowColor, color);
               data.avgShadowColor.r += color.r;
               data.avgShadowColor.b += color.b;
               data.avgShadowColor.g += color.g;
            }
            else if (a > alphaLight) {
               data.highlightColor = glColor.lightest(data.highlightColor, color);
            }

            let terminator = (alphaLight + alphaShadow) / 2.0;
            if (Math.abs(a - terminator) < 0.1) {
               numTerminatorPixels++;
               data.terminatorColor.r += color.r;
               data.terminatorColor.b += color.b;
               data.terminatorColor.g += color.g;
            }
         }
      }

      if (numLightPixels > 0) {
         data.avgLightColor.r /= numLightPixels;
         data.avgLightColor.g /= numLightPixels;
         data.avgLightColor.b /= numLightPixels;
      }
      if (numShadowPixels > 0) {
         data.avgShadowColor.r /= numShadowPixels;
         data.avgShadowColor.g /= numShadowPixels;
         data.avgShadowColor.b /= numShadowPixels;
      }
      if (numTerminatorPixels > 0) {
         data.terminatorColor.r /= numTerminatorPixels;
         data.terminatorColor.g /= numTerminatorPixels;
         data.terminatorColor.b /= numTerminatorPixels;
      }

      return data;
   }
}