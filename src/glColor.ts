import { Color } from "./Color";
import { htmlColor } from "./htmlColor";

/**
 * Color class that requires RGB values to be between 0 and 1
 */
export class glColor extends Color {

   /**
    * @param color An RGB color array
    */
   public constructor(color: number[]) {

      if (color.length != 3) {
         throw new Error("Invalid color array length (expected 3 elements)");
      }
      if (color[0] < 0 || color[0] > 1) {
         throw new Error("Invalid color 'r' value (expected [0-1])");
      }
      if (color[1] < 0 || color[1] > 1) {
         throw new Error("Invalid color 'g' value (expected [0-1])");
      }
      if (color[2] < 0 || color[2] > 1) {
         throw new Error("Invalid color 'b' value (expected [0-1])");
      }

      super(color);
   }

   /**
    * Creates an glColor object using values in a Color object.
    * 
    * @param color A generic Color object.
    */
   public static fromColor(color: Color): glColor {
      let r = glColor.clamp(color.r);
      let g = glColor.clamp(color.g);
      let b = glColor.clamp(color.b);
      return new glColor([r, g, b]);
   }

   /**
    * Clamps a number between 0 and 1.
    * 
    * @param val The value.
    * @returns The clamped value
    */
   private static clamp(val: number): number {
      if (val < 0) {
         return 0;
      }
      else if (val > 1) {
         return 1;
      }
      else {
         return val;
      }
   }

   /**
    * Converts this object to an html color object (0-255 based).
    * 
    * @returns An htmlColor object.
    */
   public toHtmlColor(): htmlColor {
      let r = Math.round(255 * this.r);
      let g = Math.round(255 * this.g);
      let b = Math.round(255 * this.b);
      return new htmlColor([r, g, b]);
   }
}