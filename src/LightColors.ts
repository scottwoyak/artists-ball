import { glColorWithTemperature } from "./glColorWithTemperature";

/**
 * Class for getting RGB values for color temperatures. RGB values
 * are between 0 and 1.
 */
export class LightColors {
   /**
    * Known color values. For other requests the class will return interpolated values
    */
   private static colors: glColorWithTemperature[] = [
      new glColorWithTemperature([255 / 255, 147 / 255, 41 / 255], 1900),
      new glColorWithTemperature([255 / 255, 197 / 255, 143 / 255], 2600),
      new glColorWithTemperature([255 / 255, 214 / 255, 170 / 255], 2850),
      new glColorWithTemperature([255 / 255, 241 / 255, 224 / 255], 3200),
      new glColorWithTemperature([255 / 255, 250 / 255, 244 / 255], 5200),
      new glColorWithTemperature([255 / 255, 255 / 255, 251 / 255], 5400),
      new glColorWithTemperature([255 / 255, 255 / 255, 255 / 255], 6000), // daylight
      new glColorWithTemperature([201 / 255, 226 / 255, 255 / 255], 7000),
      new glColorWithTemperature([64 / 255, 156 / 255, 255 / 255], 20000),
   ];

   public static get daylight(): glColorWithTemperature {
      return this.toRGB(6000);
   }
   /**
    * Gets the minimum supported temperature.
    * 
    * @returns temperature value in Kelvin.
    */
   public static get minTemperature(): number {
      return this.colors[0].temperature;
   }

   /**
    * Gets the maximum supported temperature.
    * 
    * @returns temperature value in Kelvin.
    */
   public static get maxTemperature(): number {
      return this.colors[this.colors.length - 1].temperature;
   }

   /**
    * Gets a Color matching the specified temperature.
    * 
    * @returns temperature value in Kelvin.
    */
   public static toRGB(temperature: number): glColorWithTemperature {

      if (temperature <= this.minTemperature) {
         return this.colors[0];
      }
      else if (temperature >= this.maxTemperature) {
         return this.colors[this.colors.length - 1];
      }
      else {
         for (let i = 0; i < this.colors.length - 1; i++) {
            let color1 = this.colors[i];
            let color2 = this.colors[i + 1];
            if (temperature >= color1.temperature && temperature <= color2.temperature) {
               let ratio = (temperature - color1.temperature) / (color2.temperature - color1.temperature);

               let r = color1.r + ratio * (color2.r - color1.r);
               let g = color1.g + ratio * (color2.g - color1.g);
               let b = color1.b + ratio * (color2.b - color1.b);
               return new glColorWithTemperature([r, g, b], temperature);
            }
         }

         // shouldn't get here, but if we do, return the last color
         return this.colors[this.colors.length - 1];
      }
   }
}