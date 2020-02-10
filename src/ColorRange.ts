import { Color } from "./Color";

/**
 * Interpolates and array of colors
 */
export class ColorRange {
   /**
    * The colors
    */
   private colors: Color[];

   /**
    * Constructor
    * 
    * @param colors The colors to interpolate
    */
   public constructor(colors: Color[]) {
      this.colors = colors;
   }

   /**
    * Gets an interpolated color.
    * 
    * @param value A value between 0 and 1.
    */
   public get(value: number): Color {

      if (value < 0) {
         return this.colors[0];
      }
      else if (value >= 1) {
         return this.colors[this.colors.length - 1];
      }
      else {
         let index = Math.floor((this.colors.length - 1) * value);
         let partial = (this.colors.length - 1) * value - index;

         let r = this.colors[index].r + partial * (this.colors[index + 1].r - this.colors[index].r);
         let g = this.colors[index].g + partial * (this.colors[index + 1].g - this.colors[index].g);
         let b = this.colors[index].b + partial * (this.colors[index + 1].b - this.colors[index].b);

         return new Color([r, g, b]);
      }
   }
}