import { clamp } from '../../Util/Globals';
import { hsvColor } from '../../Util/hsvColor';
import { ImageCanvas } from './ImageCanvas';

export class ImageCanvas2D extends ImageCanvas {

   public constructor(parent: HTMLElement, id: string) {
      super(parent, id);
   }

   public clear(): void {
      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
         height = this.zoom * canvasHeight;
         width = height * imgAR;
      }
      else {
         width = this.zoom * canvasWidth;
         height = width / imgAR;
      }

      let x = (canvasWidth - width) / 2.0 + this.xOffset;
      let y = (canvasHeight - height) / 2.0 - this.yOffset;

      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (ctx.filter) {
         ctx.filter =
            'contrast(' + this.contrast + '%) ' +
            'brightness(' + this.brightness + '%) ' +
            'saturate(' + this.saturate + '%) ' +
            'blur(' + this.blur + 'px) ';
      }

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

      // if filters are not supported on contexts, ummm Safari, do our own
      if (ctx.filter === undefined) {
         if (this.contrast !== 100) {
            let amount = this.contrast / 100;
            for (let i = 0; i < data.length; i += 4) {
               data[i + 0] = ((((data[i + 0] / 255) - .5) * amount) + .5) * 255;
               data[i + 1] = ((((data[i + 1] / 255) - .5) * amount) + .5) * 255;
               data[i + 2] = ((((data[i + 2] / 255) - .5) * amount) + .5) * 255;
            }
         }

         if (this.brightness !== 100) {
            let amount = this.brightness / 100;
            for (let i = 0; i < data.length; i += 4) {
               data[i + 0] *= amount;
               data[i + 1] *= amount;
               data[i + 2] *= amount;
            }
         }

         if (this.saturate !== 100) {
            let amount = this.saturate / 100;
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
      }

      let grayScale = this.grayScale;
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

         if (grayScale) {
            //let val = 0.299 * r + 0.587 * g + 0.114 * b;
            // adobe Y'204 luminosity
            let val = clamp(255 * newLum, 0, 255);
            data[i + 0] = val;
            data[i + 1] = val;
            data[i + 2] = val;
         }
         else {
            let ratio = newLum / oldLum;
            data[i + 0] = clamp(data[i + 0] * ratio, 0, 255);
            data[i + 1] = clamp(data[i + 1] * ratio, 0, 255);
            data[i + 2] = clamp(data[i + 2] * ratio, 0, 255);
         }
      }

      ctx.putImageData(imageData, x, y);
   }
}