import { htmlColor } from './htmlColor';
import { glColor3 } from '../gl/glColor';

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
    * Sets the HSV values from html (0-255) RGB values
    * 
    * @param r Red value
    * @param g Green value
    * @param b Blue value
    */
   public fromHtmlValues(r: number, g: number, b: number): void {

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      let h = 0;
      const s = (max === 0 ? 0 : d / max);
      const v = max / 255;

      switch (max) {
         case min: h = 0; break;
         case r: h = (g - b) + d * (g < b ? 6 : 0); h /= 6 * d; break;
         case g: h = (b - r) + d * 2; h /= 6 * d; break;
         case b: h = (r - g) + d * 4; h /= 6 * d; break;
      }

      this.h = h;
      this.s = s;
      this.v = v;
   }

   /**
    * Creates RGB values
    * 
    * @param range Max RGB value
    * @returns The RGB values as an array
    */
   public toRGBValues(range = 255): number[] {
      let r, g, b;
      const i = Math.floor(this.h * 6);
      const f = this.h * 6 - i;
      const p = this.v * (1 - this.s);
      const q = this.v * (1 - f * this.s);
      const t = this.v * (1 - (1 - f) * this.s);
      switch (i % 6) {
         case 0: r = this.v, g = t, b = p; break;
         case 1: r = q, g = this.v, b = p; break;
         case 2: r = p, g = this.v, b = t; break;
         case 3: r = p, g = q, b = this.v; break;
         case 4: r = t, g = p, b = this.v; break;
         case 5: r = this.v, g = p, b = q; break;
         default: r = 0; g = 0; b = 0;
      }

      return [range * r, range * g, range * b];
   }

   /**
    * Creates an hsvColor object from an htmlColor object.
    * 
    * @param color The htmlColor object.
    * @returns The hsvColor object.
    */
   public static fromHtmlColor(color: htmlColor): hsvColor {
      const r = color.r;
      const g = color.g;
      const b = color.b;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const d = max - min;
      let h = 0;
      const s = (max === 0 ? 0 : d / max);
      const v = max / 255;

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
      return new glColor3(this.toRGBValues(1));
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