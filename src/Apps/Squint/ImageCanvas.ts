import { GUI } from '../../GUI/GUI';
import { clamp } from '../../Util/Globals';
import { hsvColor } from '../../Util/hsvColor';

export class ImageCanvas {
   protected canvas: HTMLCanvasElement;
   public zoom = 1;
   public xOffset = 0;
   public yOffset = 0;

   public chroma = 100;
   public blur = 0;
   public black = 0;
   public white = 1;
   public midPt = 0.5;
   public midValue = 0.5;
   public showAsTemperature = false;

   public numLevels = NaN;

   public get element(): HTMLElement {
      return this.canvas;
   }

   public set width(px: number) {
      this.canvas.width = px;
   }
   public get width(): number {
      return this.canvas.width;
   }

   public set height(px: number) {
      this.canvas.height = px;
   }
   public get height(): number {
      return this.canvas.height;
   }

   public constructor(parent: HTMLElement, id: string) {
      this.canvas = GUI.create('canvas', id, parent);
   }

   public clear(): void {
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
   }

   private applyLevels(data: Uint8ClampedArray, width: number, height: number): void {
      let realMidPt = this.black + this.midPt * (this.white - this.black);
      for (let i = 0; i < data.length; i += 4) {

         let oldLum = (0.3086 * data[i + 0] + 0.6094 * data[i + 1] + 0.0820 * data[i + 2]) / 255.0;
         let newLum = NaN;

         if (oldLum <= this.black) {
            newLum = 0;
         }
         else if (oldLum >= this.white) {
            newLum = 1;
         }
         else {
            if (oldLum < realMidPt) {
               newLum = 0 + this.midValue * ((oldLum - this.black) / (realMidPt - this.black));
            }
            else {
               newLum = this.midValue + (1 - this.midValue) * (oldLum - realMidPt) / (this.white - realMidPt);
            }
         }

         if (isNaN(this.numLevels) === false) {
            let val = newLum;
            newLum = (Math.floor(this.numLevels * (val - 0.0001)) + 0.5) / this.numLevels;
         }

         let ratio = newLum / oldLum;
         data[i + 0] = clamp(data[i + 0] * ratio, 0, 255);
         data[i + 1] = clamp(data[i + 1] * ratio, 0, 255);
         data[i + 2] = clamp(data[i + 2] * ratio, 0, 255);
      }
   }

   private applyChroma(data: Uint8ClampedArray, width: number, height: number): void {
      let amount = this.chroma / 100;
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

   private applyBlur(data: Uint8ClampedArray, width: number, height: number): void {
      let index;
      let blur = new Uint8ClampedArray(4 * width);
      let span = Math.floor(this.blur);
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
         for (let row = 0; row < width; row++) {
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

   public draw(img: HTMLImageElement): void {
      const canvasWidth = this.canvas.width;
      const canvasHeight = this.canvas.height;
      const canvasAR = canvasWidth / canvasHeight;

      const imgWidth = img.width;
      const imgHeight = img.height;
      const imgAR = imgWidth / imgHeight;

      let width: number;
      let height: number;

      if (canvasAR > imgAR) {
         height = Math.floor(this.zoom * canvasHeight);
         width = Math.floor(height * imgAR);
      }
      else {
         width = Math.floor(this.zoom * canvasWidth);
         height = Math.floor(width / imgAR);
      }

      let x = (canvasWidth - width) / 2.0 + this.xOffset;
      let y = (canvasHeight - height) / 2.0 - this.yOffset;

      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, x, y, width, height);

      // adjust dimensions so we're now only editing what is visible
      let right = Math.min(canvasWidth, width + x);
      let bottom = Math.min(canvasHeight, height + y);
      x = Math.max(0, x);
      y = Math.max(0, y);
      width = Math.min(right - x, canvasWidth);
      height = Math.min(bottom - y, canvasHeight);

      let imageData = ctx.getImageData(x, y, width, height);
      let data = imageData.data;

      if (isNaN(this.numLevels) === false) {
         this.blur = 3;
         this.applyBlur(data, width, height);
      }

      if (this.chroma !== 100) {
         this.applyChroma(data, width, height);
      }

      if (this.black !== 0 || this.midPt !== 0.5 || this.white !== 1 || isNaN(this.numLevels) === false) {
         this.applyLevels(data, width, height);
      }

      if (this.showAsTemperature) {
         // first compute min and max temp
         let minTemp = 255;
         let maxTemp = -255;
         let hsv = new hsvColor([0, 0, 0]);
         for (let i = 0; i < data.length; i += 4) {
            let r = data[i + 0];
            let g = data[i + 1];
            let b = data[i + 2];
            hsv.fromHtmlValues(r, g, b);

            let temp = this.temperature(r, g, b);
            minTemp = Math.min(minTemp, temp);
            maxTemp = Math.max(maxTemp, temp);
         }
         //console.log(minTemp + '   ' + maxTemp);
         let avgTemp = (maxTemp + minTemp) / 2;

         for (let i = 0; i < data.length; i += 4) {
            let r = data[i + 0];
            let g = data[i + 1];
            let b = data[i + 2];
            let temp = this.temperature(r, g, b);

            if (temp < avgTemp) {
               r = 0;
               g = 0;
               b = 255 * (avgTemp - temp) / (avgTemp - minTemp);
               r = 255 - b;
               g = 255 - b;
               b = 255;
            }
            else {
               r = 255 * (temp - avgTemp) / (maxTemp - avgTemp);
               g = 0;
               b = 0;
               g = 255 - r;
               b = 255 - r;
               r = 255;
            }

            data[i + 0] = r;
            data[i + 1] = g;
            data[i + 2] = b;
         }
      }

      ctx.putImageData(imageData, x, y);
   }

   private temperature(r: number, g: number, b: number): number {
      return 0.5 + (((g + r) / 2 - b) / 255) / 2;
   }
}