import { ValueRange } from "./ValueRange";
import { clamp, mix, toRad } from "../../Util/Globals";

export let DEFAULT_THRESHOLD1 = 40;
export let DEFAULT_THRESHOLD2 = 70;

/**
 * Keeps track of 3 values in the light based on threshold angles
 * for the planes (stored in degrees) and the light range (highlight
 * to shadow colors).
 */
export class ValuePlanes {
   private _threshold1 = DEFAULT_THRESHOLD1;
   private _threshold2 = DEFAULT_THRESHOLD2;
   private valueRange: ValueRange;

   private _lightLight: number;
   private _midLight: number;
   private _darkLight: number;

   public constructor(valueRange: ValueRange) {
      this.valueRange = valueRange;
      this.computeColors();
   }

   public get threshold1(): number {
      return this._threshold1;
   }
   public set threshold1(angleInDeg: number) {
      this._threshold1 = angleInDeg;
      this._threshold2 = Math.max(this._threshold2, angleInDeg);
      this.computeColors();
   }

   public get threshold2(): number {
      return this._threshold2;
   }
   public set threshold2(angleInDeg: number) {
      this._threshold2 = angleInDeg;
      this._threshold1 = Math.min(this._threshold1, angleInDeg);
      this.computeColors();
   }

   public get highlight(): number {
      return this.valueRange.maxIntensity;
   }
   public set highlight(val: number) {
      this.valueRange.maxIntensity = val;
      this.computeColors();
   }

   public get shadow(): number {
      return this.valueRange.ambientIntensity;
   }
   public set shadow(val: number) {
      this.valueRange.ambientIntensity = val;
      this.computeColors();
   }

   public get lightLight(): number {
      return this._lightLight;
   }
   public get midLight(): number {
      return this._midLight;
   }
   public get darkLight(): number {
      return this._darkLight;
   }

   private colorAt(deg: number): number {
      deg = clamp(deg, 0, 90);
      return mix(this.shadow, this.highlight - this.valueRange.specularIntensity, Math.cos(toRad(deg)));
   }

   public computeColors() {
      this._lightLight = this.colorAt(0.5 * this.threshold1);
      this._midLight = this.colorAt(mix(this.threshold1, this.threshold2, 0.5));
      this._darkLight = this.colorAt((this.threshold2 + 90) / 2);
   }
}