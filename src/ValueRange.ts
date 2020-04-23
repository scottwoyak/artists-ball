/**
 * Keeps track of a value range - highlight to shadow color. A minimum
 * differential is kept between the two when one is changed
 */
export class ValueRange {

   public static Standard = new ValueRange(1.0, 0.2, 0.1)
   public static EmphasizeHighlights = new ValueRange(1.0, 0.2, 0.75);

   private _highlight: number;
   private _shadow: number;
   private _highlightDelta: number;

   public constructor(highlight: number, shadow: number, highlightDelta: number) {
      this._highlight = highlight;
      this._shadow = shadow;
      this._highlightDelta = highlightDelta;
   }

   public get highlightDelta(): number {
      return this._highlightDelta;
   }

   public get highlight(): number {
      return this._highlight;
   }
   public set highlight(val: number) {
      this._highlight = Math.min(Math.max(val, this._highlightDelta), 1.0);
      this._shadow = Math.min(this._shadow, this._highlight - this._highlightDelta);
   }

   public get ambient(): number {
      return this.shadow;
   }
   public set ambient(val: number) {
      this.shadow = val;
   }

   public get shadow(): number {
      return this._shadow;
   }
   public set shadow(val: number) {
      this._shadow = Math.max(Math.min(val, 1 - this._highlightDelta), 0);
      this._highlight = Math.max(this._highlight, this._shadow + this._highlightDelta);
   }

   public get lightIntensity(): number {
      return this.highlight - this.shadow - this._highlightDelta;
   }
}