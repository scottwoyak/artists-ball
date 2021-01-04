import { clamp } from '../../Util/Globals';

export class ImageFilter {
   // eslint-disable-next-line @typescript-eslint/no-empty-function
   private constructor() {
   }

   public static chroma(img: ImageData, chroma: number): void {

      let data = img.data;
      let width = img.width;
      let height = img.height;

      let amount = chroma / 100;
      const lumR = (1 - amount) * .3086;
      const lumG = (1 - amount) * .6094;
      const lumB = (1 - amount) * .0820;
      const shiftW = width << 2;
      for (let j = 0; j < height; j++) {
         const offset = j * shiftW;
         for (let i = 0; i < width; i++) {
            const pos = offset + (i << 2);
            const r = data[pos + 0];
            const g = data[pos + 1];
            const b = data[pos + 2];

            data[pos + 0] = ((lumR + amount) * r) + (lumG * g) + (lumB * b);
            data[pos + 1] = (lumR * r) + ((lumG + amount) * g) + (lumB * b);
            data[pos + 2] = (lumR * r) + (lumG * g) + ((lumB + amount) * b);
         }
      }
   }

   public static levels(
      img: ImageData,
      white: number,
      black: number,
      midPt: number,
      midValue: number,
      numLevels: number
   ): void {

      let data = img.data;

      let realMidPt = black + midPt * (white - black);
      for (let i = 0; i < data.length; i += 4) {

         let oldLum = (0.3086 * data[i + 0] + 0.6094 * data[i + 1] + 0.0820 * data[i + 2]) / 255.0;
         let newLum = NaN;

         if (oldLum <= black) {
            newLum = 0;
         }
         else if (oldLum >= white) {
            newLum = 1;
         }
         else {
            if (oldLum < realMidPt) {
               newLum = 0 + midValue * ((oldLum - black) / (realMidPt - black));
            }
            else {
               newLum = midValue + (1 - midValue) * (oldLum - realMidPt) / (white - realMidPt);
            }
         }

         if (isNaN(numLevels) === false) {
            let val = newLum;
            newLum = (Math.floor(numLevels * (val - 0.0001)) + 0.5) / numLevels;
         }

         let ratio = newLum / oldLum;
         if (oldLum < 10 / 255) {
            // for really dark values, scale up as black and white
            // rather than the actual color which erroneously turns
            // blue or sometimes red
            data[i + 0] = clamp(255 * newLum, 0, 255);
            data[i + 1] = clamp(255 * newLum, 0, 255);
            data[i + 2] = clamp(255 * newLum, 0, 255);
         }
         else {
            data[i + 0] = clamp(data[i + 0] * ratio, 0, 255);
            data[i + 1] = clamp(data[i + 1] * ratio, 0, 255);
            data[i + 2] = clamp(data[i + 2] * ratio, 0, 255);
         }
      }
   }

   /*
   public static blur(img: ImageData, blurSize: number): void {

      let data = img.data;
      let width = img.width;
      let height = img.height;

      let index;
      let blur = new Uint8ClampedArray(4 * width);
      let span = Math.floor(blurSize);
      for (let row = 0; row < height; row++) {
         // average the data
         for (let col = 0; col < width; col++) {
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let min = Math.max(0, col - span);
            let max = Math.min(width - 1, col + span + 1);
            for (let c = min; c < max; c++) {
               index = 4 * (row * width + c);
               sumR += data[index + 0];
               sumG += data[index + 1];
               sumB += data[index + 2];
            }
            let numSamples = max - min;
            blur[4 * col + 0] = sumR / numSamples;
            blur[4 * col + 1] = sumG / numSamples;
            blur[4 * col + 2] = sumB / numSamples;
         }

         // write it back
         for (let col = 0; col < width; col++) {
            index = 4 * (row * width + col);
            data[index + 0] = blur[4 * col + 0];
            data[index + 1] = blur[4 * col + 1];
            data[index + 2] = blur[4 * col + 2];
         }
      }

      blur = new Uint8ClampedArray(4 * height);
      for (let col = 0; col < width; col++) {
         // average the data
         for (let row = 0; row < height; row++) {
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            let min = Math.max(0, row - span);
            let max = Math.min(height - 1, row + span + 1);
            for (let r = min; r < max; r++) {
               index = 4 * (r * width + col);
               sumR += data[index + 0];
               sumG += data[index + 1];
               sumB += data[index + 2];
            }
            let numSamples = max - min;
            blur[4 * row + 0] = sumR / numSamples;
            blur[4 * row + 1] = sumG / numSamples;
            blur[4 * row + 2] = sumB / numSamples;
         }

         // write it back
         for (let row = 0; row < height; row++) {
            index = 4 * (row * width + col);
            data[index + 0] = blur[4 * row + 0];
            data[index + 1] = blur[4 * row + 1];
            data[index + 2] = blur[4 * row + 2];
         }
      }
   }
   */
}