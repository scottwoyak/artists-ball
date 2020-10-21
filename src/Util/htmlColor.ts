import { Color } from './Color';
import { toCss } from './Globals';
import { glColor3 } from '../gl/glColor';

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

   public get luminosity(): number {
      // adobe Y'204 luminosity
      return (0.3086 * this.r + 0.6094 * this.g + 0.0820 * this.b) / 255;
   }

   public set luminosity(value: number) {
      let oldLuminosity = this.luminosity;
      /*
      this.r += 255 * 0.3086 * (value - oldLuminosity);
      this.g += 255 * 0.6094 * (value - oldLuminosity);
      this.b += 255 * 0.0820 * (value - oldLuminosity);
      */
      /*
      this.r += 255 * (value - oldLuminosity) / 0.3086;
      this.g += 255 * (value - oldLuminosity) / 0.6094;
      this.b += 255 * (value - oldLuminosity) / 0.0820;
      */
      let f = value / oldLuminosity;
      this.r *= f;
      this.g += f;
      this.b += f;

   }

   /**
    * @param color An RGB color array
    */
   public constructor(color: number[]) {

      if (color.length != 3) {
         throw new Error('Invalid color array length (expected 3 elements)');
      }
      if (color[0] < 0 || color[0] > 255) {
         throw new Error('Invalid color \'r\' value (expected [0-255])');
      }
      if (color[1] < 0 || color[1] > 255) {
         throw new Error('Invalid color \'g\' value (expected [0-255])');
      }
      if (color[2] < 0 || color[2] > 255) {
         throw new Error('Invalid color \'b\' value (expected [0-255])');
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
      const hex = c.toString(16);
      return hex.length == 1 ? '0' + hex : hex;
   }

   /**
    * Converts this object to a hex string (e.g. #0f0f0f).
    * 
    * @returns A hex string.
    */
   public toHex(): string {
      const rHex = this.componentToHex(this.r);
      const gHex = this.componentToHex(this.g);
      const bHex = this.componentToHex(this.b);
      return '#' + rHex + gHex + bHex;
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
      const regex = /\d+/g;
      const vals = css.match(regex).slice(0, 3);
      return new htmlColor([parseInt(vals[0]), parseInt(vals[1]), parseInt(vals[2])]);
   }

   /**
    * Creates an htmlColor object from a hex string
    * 
    * @param hex The hex string
    * @returns The htmlColor object
    */
   public static fromHex(hex: string): htmlColor {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
         const r = parseInt(result[1], 16);
         const g = parseInt(result[2], 16);
         const b = parseInt(result[3], 16);
         return new htmlColor([r, g, b]);
      }
      else {
         return new htmlColor([0, 0, 0]);
      }
   }

   /**
    * Creates an htmlColor object using values in a Color object.
    * 
    * @param color A generic Color object.
    */
   public static fromColor(color: Color): htmlColor {
      const r = htmlColor.clamp(color.r);
      const g = htmlColor.clamp(color.g);
      const b = htmlColor.clamp(color.b);
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
      const rgb = Math.round((this.r + this.g + this.b) / 3);
      return new htmlColor([rgb, rgb, rgb]);
   }

   /**
    * Converts this object to a WebGL color object (0-1 based)
    * 
    * @returns A glColor object.
    */
   public toGlColor(): glColor3 {
      return new glColor3([this.r / 255, this.g / 255, this.b / 255]);
   }
}