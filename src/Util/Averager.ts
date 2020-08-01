export class Averager {
   private values: number[] = [];
   private _maxSamples: number;

   public get numSamples(): number {
      return this.values.length;
   }

   public get maxSamples(): number {
      return this._maxSamples;
   }

   public set maxSamples(value: number) {
      this._maxSamples = value;
      this.trimIfNeeded();
   }

   public get average(): number {
      let total = 0;
      let numValues = this.values.length;

      if (numValues === 0) {
         return Number.NaN;
      }
      else {
         for (let i = 0; i < numValues; i++) {
            total += this.values[i];
         }
         return total / numValues;
      }
   }

   public constructor(maxSamples = 5) {
      this.maxSamples = maxSamples;
   }

   public push(value: number) {
      this.values.push(value);
      this.trimIfNeeded();
   }

   private trimIfNeeded() {
      if (this.values.length > this.maxSamples) {
         let start = this.values.length - this.maxSamples;
         this.values = this.values.slice(start);
      }
   }

   public clear() {
      this.values = [];
   }
}