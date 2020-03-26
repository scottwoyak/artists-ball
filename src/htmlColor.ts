import { Color } from "./Color";
import { glColor } from "./glColor";
import { toCss } from "./Globals";

/**
 * Color class that requires RGB values to be between 0 and 255
 */
export class htmlColor extends Color {

   public static readonly white = new htmlColor([255, 255, 255]);
   public static readonly black = new htmlColor([0, 0, 0]);
   public static readonly red = new htmlColor([255, 0, 0]);
   public static readonly green = new htmlColor([0, 255, 0]);
   public static readonly blue = new htmlColor([0, 0, 255]);
   public static readonly orange = new htmlColor([255, 165, 0]);

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
    * @returns The hex string
    */
   protected componentToHex(c: number): string {
      var hex = c.toString(16);
      return hex.length == 1 ? "0" + hex : hex;
   }

   /**
    * Converts this object to a hex string (e.g. #0f0f0f).
    * 
    * @returns A hex string.
    */
   public toHex(): string {
      let rHex = this.componentToHex(this.r);
      let gHex = this.componentToHex(this.g);
      let bHex = this.componentToHex(this.b);
      return "#" + rHex + gHex + bHex;
   }

   /**
    * Converts this object to a css string (e.g. 'rgb(128,228,32)').
    *
    * @returns A css string.
    */
   public toCss(): string {
      return toCss(this.r, this.g, this.b);
   }

   /**
    * Converts a css style string (e.g. 'rgb(24,36,83)') to a color
    * 
    * @param css The css string.
    * @returns The color.
    */
   public static fromCss(css: string): htmlColor {
      let regex = /\d+/g;
      let vals = css.match(regex).slice(0, 3);
      return new htmlColor([parseInt(vals[0]), parseInt(vals[1]), parseInt(vals[2])]);
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
    * Creates an htmlColor object using values in a Color object.
    * 
    * @param color A generic Color object.
    */
   public static fromColor(color: Color): htmlColor {
      let r = htmlColor.clamp(color.r);
      let g = htmlColor.clamp(color.g);
      let b = htmlColor.clamp(color.b);
      return new htmlColor([r, g, b]);
   }

   /**
    * Rounds a number to a whole number and clamps it between 0 and 255.
    * 
    * @param val The value.
    * @returns The rounded & clamped value
    */
   private static clamp(val: number): number {
      val = Math.round(val);
      if (val < 0) {
         return 0;
      }
      else if (val > 255) {
         return 255;
      }
      else {
         return val;
      }
   }

   /**
    * Converts this color to an equivalent gray-scale color
    * 
    * @returns The gray-scale color.
    */
   public toGray(): htmlColor {
      let rgb = Math.round((this.r + this.g + this.b) / 3);
      return new htmlColor([rgb, rgb, rgb]);
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