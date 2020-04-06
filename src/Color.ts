
/**
 * Class for representing color values. Values may be on a 0-1 or 0-255 scale.
 */
export class Color {
   public r: number;
   public g: number;
   public b: number;
   public a: number;

   /**
    * @param color RGB values to store in this object
    */
   public constructor(color: number[]) {
      this.r = color[0];
      this.g = color[1];
      this.b = color[2];

      if (color.length === 4) {
         this.a = color[3];
      }
   }
}