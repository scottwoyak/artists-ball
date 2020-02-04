import { Color } from "./Color";

export class ColorRange {
   private colors: Color[];

   public constructor(colors: Color[]) {
      this.colors = colors;
   }

   public get(value: number): Color {

      if (value < 0) {
         return this.colors[0];
      }
      else if (value >= 1) {
         return this.colors[this.colors.length - 1];
      }
      else {
         let index = Math.floor((this.colors.length - 1) * value);
         let partial = (this.colors.length - 1) * value - index;

         let r = this.colors[index].r + partial * (this.colors[index + 1].r - this.colors[index].r);
         let g = this.colors[index].g + partial * (this.colors[index + 1].g - this.colors[index].g);
         let b = this.colors[index].b + partial * (this.colors[index + 1].b - this.colors[index].b);

         return new Color([r, g, b]);
      }
   }
}