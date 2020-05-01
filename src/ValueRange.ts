/**
 * Keeps track of a value range - highlight to shadow color. A minimum
 * differential is kept between the two when one is changed
 */
export class ValueRange {

   public static get Standard() {
      return new ValueRange(1.0, 0.2, 0.1);
   }

   public static get EmphasizeHighlights() {
      return new ValueRange(1.0, 0.2, 0.75);
   }

   private _maxIntensity: number;
   private _ambientIntensity: number;
   private _specularIntensity: number;

   public constructor(maxIntensity: number, ambientIntensity: number, specularIntensity: number) {
      this._maxIntensity = maxIntensity;
      this._ambientIntensity = ambientIntensity;
      this._specularIntensity = specularIntensity;
   }

   public get specularIntensity(): number {
      return this._specularIntensity;
   }

   public get maxIntensity(): number {
      return this._maxIntensity;
   }
   public set maxIntensity(val: number) {
      this._maxIntensity = Math.min(Math.max(val, this._specularIntensity), 1.0);
      this._ambientIntensity = Math.min(this._ambientIntensity, this._maxIntensity - this._specularIntensity);
   }

   public get ambientIntensity(): number {
      return this._ambientIntensity;
   }
   public set ambientIntensity(val: number) {
      this.shadow = val;
   }

   public get shadow(): number {
      return this._ambientIntensity;
   }
   public set shadow(val: number) {
      this._ambientIntensity = Math.max(Math.min(val, 1 - this._specularIntensity), 0);
      this._maxIntensity = Math.max(this._maxIntensity, this._ambientIntensity + this._specularIntensity);
   }

   public get diffuseIntensity(): number {
      return this.maxIntensity - this._ambientIntensity - this._specularIntensity;
   }
}