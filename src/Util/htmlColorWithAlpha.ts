import { htmlColor } from "./htmlColor";
import { toCss } from "./Globals";

/**
 * An html color with a transparency value
 */
export class htmlColorWithAlpha extends htmlColor {

   public static readonly transparent = new htmlColorWithAlpha([0, 0, 0, 0]);

   /** The transparency (alpha) value */
   public a: number = 255;

   /**
    * @param color An RGBA color array
    */
   public constructor(color: number[]) {

      super([color[0], color[1], color[2]]);

      if (color.length != 4) {
         throw new Error("Invalid color array length (expected 4 elements)");
      }

      if (color[4] < 0 || color[4] > 255) {
         throw new Error("Invalid color 'a' value (expected [0-255])");
      }

      this.a = color[3];
   }

   /**
    * Converts this object to a css string (e.g. 'rgb(128,228,32,255)').
    *
    * @returns A css string.
    */
   public toCss(): string {
      return toCss(this.r, this.g, this.b, this.a);
   }
}