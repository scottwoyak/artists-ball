import { Color } from "./Color";
import { glColor } from "./glColor";
import { hsvColor } from "./hsvColor";

/**
 * Color class that requires RGB values to be between 0 and 255
 */
export class htmlColor extends Color {

   /**
    * @param color An RGB color array
    */
   public constructor(color: number[]) {

      if (color.length != 3) {
         throw new Error("Invalid color array length (expected 3 elements)");
      }
      if (color[0] < 0 || color[0] > 255) {
         throw new Error("Invalid color 'r' value (expected [0-255])");
      }
      if (color[1] < 0 || color[1] > 255) {
         throw new Error("Invalid color 'g' value (expected [0-255])");
      }
      if (color[2] < 0 || color[2] > 255) {
         throw new Error("Invalid color 'b' value (expected [0-255])");
      }

      super(color);
   }

   /**
    * Converts a value to a hex string
    * 
    * @param c The numeric value
    */
   private componentToHex(c: number): string {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
   }

   /**
    * Converts this object to a hex string (e.g. #0f0f0f);
    */
   public toHex(): string {
      let rHex = this.componentToHex(this.r);
      let gHex = this.componentToHex(this.g);
      let bHex = this.componentToHex(this.b);
      return "#" + rHex + gHex + bHex;
   }

   /**
    * Creates an htmlColor object from a hex string
    * 
    * @param hex The hex string
    * @returns The htmlColor object
    */
   public static fromHex(hex: string): htmlColor {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
         let r = parseInt(result[1], 16);
         let g = parseInt(result[2], 16);
         let b = parseInt(result[3], 16);
         return new htmlColor([r, g, b]);
      }
      else {
         return null;
      }
   }

   /**
    * Converts this object to a WebGL color object (0-1 based)
    * 
    * @returns A glColor object.
    */
   public toGlColor(): glColor {
      return new glColor([this.r / 255, this.g / 255, this.b / 255]);
   }
}