/**
 * Class for representing color values. Values may be on a 0-1 or 0-255 scale.
 */
export class Color {
   readonly r: number;
   readonly g: number;
   readonly b: number;

   /**
    * @param color RGB values to store in this object
    */
   public constructor(color: number[]) {
      this.r = color[0];
      this.g = color[1];
      this.b = color[2];
   }
}