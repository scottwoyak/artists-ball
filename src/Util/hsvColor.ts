import { htmlColor } from "./htmlColor";
import { glColor3 } from "../gl/glColor";

/**
 * Class for representing color values. Values are on a 0-1 scale.
 */
export class hsvColor {
   public h: number;
   public s: number;
   public v: number;

   /**
    * @param color HSV values to store in this object
    */
   public constructor(color: number[]) {
      this.h = color[0];
      this.s = color[1];
      this.v = color[2];
   }

   /**
    * Creates an hsvColor object from an htmlColor object.
    * 
    * @param color The htmlColor object.
    * @returns The hsvColor object.
    */
   public static fromHtmlColor(color: htmlColor): hsvColor {
      let r = color.r;
      let g = color.g;
      let b = color.b;

      let max = Math.max(r, g, b);
      let min = Math.min(r, g, b);
      let d = max - min;
      let h;
      let s = (max === 0 ? 0 : d / max);
      let v = max / 255;

      switch (max) {
         case min: h = 0; break;
         case r: h = (g - b) + d * (g < b ? 6 : 0); h /= 6 * d; break;
         case g: h = (b - r) + d * 2; h /= 6 * d; break;
         case b: h = (r - g) + d * 4; h /= 6 * d; break;
      }

      return new hsvColor([h, s, v]);
   }

   /**
    * Creates an hsvColor object from a glColor object.
    * 
    * @param color The glColor object.
    * @returns The hsvColor object.
    */
   public static fromGlColor(color: glColor3): hsvColor {
      return hsvColor.fromHtmlColor(color.toHtmlColor());
   }

   /**
    * Creates a glColor object from this object.
    * 
    * @returns The glColor object.
    */
   public toGlColor(): glColor3 {

      var r, g, b, i, f, p, q, t;
      i = Math.floor(this.h * 6);
      f = this.h * 6 - i;
      p = this.v * (1 - this.s);
      q = this.v * (1 - f * this.s);
      t = this.v * (1 - (1 - f) * this.s);
      switch (i % 6) {
         case 0: r = this.v, g = t, b = p; break;
         case 1: r = q, g = this.v, b = p; break;
         case 2: r = p, g = this.v, b = t; break;
         case 3: r = p, g = q, b = this.v; break;
         case 4: r = t, g = p, b = this.v; break;
         case 5: r = this.v, g = p, b = q; break;
      }

      return new glColor3([r, g, b]);
   }

   /**
    * Creates an htmlColor object from this object.
    * 
    * @returns The glColor object.
    */
   public toHtmlColor(): htmlColor {
      return this.toGlColor().toHtmlColor();
   }
}