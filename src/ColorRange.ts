import { htmlColor } from "./htmlColor";

/**
 * Interpolates and array of colors
 */
export class ColorRange {
   /**
    * The colors
    */
   private colors: htmlColor[];

   /**
    * Constructor
    * 
    * @param colors The colors to interpolate
    */
   public constructor(colors: htmlColor[]) {
      this.colors = colors;
   }

   /**
    * Gets an interpolated color.
    * 
    * @param value A value between 0 and 1.
    */
   public get(value: number): htmlColor {

      if (value < 0) {
         return this.colors[0];
      }
      else if (value >= 1) {
         return this.colors[this.colors.length - 1];
      }
      else {
         let index = Math.floor((this.colors.length - 1) * value);
         let partial = (this.colors.length - 1) * value - index;

         let r = Math.round(this.colors[index].r + partial * (this.colors[index + 1].r - this.colors[index].r));
         let g = Math.round(this.colors[index].g + partial * (this.colors[index + 1].g - this.colors[index].g));
         let b = Math.round(this.colors[index].b + partial * (this.colors[index + 1].b - this.colors[index].b));

         return new htmlColor([r, g, b]);
      }
   }
}