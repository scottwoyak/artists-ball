import { glColor } from "./glColor";

/**
 * Class that adds temperature to a Color object
 */
export class glColorWithTemperature extends glColor {
   /**
    * Temperature in Kelvin
    */
   public temperature: number;

   /**
    * @param color An RGB color array
    * @param temperature Temperature in Kelvin
    */
   public constructor(color: number[], temperature: number) {
      super(color);
      this.temperature = temperature;
   }
}