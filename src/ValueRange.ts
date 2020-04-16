/**
 * Keeps track of a value range - highlight to shadow color. A minimum
 * differential is kept between the two when one is changed
 */
export class ValueRange {
   private _highlight: number = 1.0;
   private _shadow: number = 0.2;
   readonly highlightDifference = 0.1;

   public get highlight(): number {
      return this._highlight;
   }
   public set highlight(val: number) {
      this._highlight = Math.min(Math.max(val, this.highlightDifference), 1.0);
      this._shadow = Math.min(this._shadow, this._highlight - this.highlightDifference);
   }

   public get shadow(): number {
      return this._shadow;
   }
   public set shadow(val: number) {
      this._shadow = Math.max(Math.min(val, 1 - this.highlightDifference), 0);
      this._highlight = Math.max(this._highlight, this._shadow + this.highlightDifference);
   }

   public get lightIntensity(): number {
      return this.highlight - this.shadow - this.highlightDifference;
   }
}