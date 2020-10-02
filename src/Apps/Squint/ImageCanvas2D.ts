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

   public draw(img: HTMLImageElement, xOffset: number, yOffset: number): void {
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

      const x = (canvasWidth - width) / 2.0 + xOffset;
      const y = (canvasHeight - height) / 2.0 - yOffset;

      const ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      if (ctx.filter) {
         ctx.filter =
            'contrast(' + this.contrast + '%) ' +
            'brightness(' + this.brightness + '%) ' +
            'saturate(' + this.saturate + '%) ' +
            'saturate(' + this.saturate + '%) ' +
            'blur(' + blur + 'px) ';
      }

      ctx.drawImage(img, x, y, width, height);

      // if filters are not supported on contexts, ummm Safari, do our own
      if (ctx.filter === undefined) {
         let imageData = ctx.getImageData(x, y, width, height);
         let data = imageData.data;

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
         ctx.putImageData(imageData, x, y);
      }

      this.applyCustomFilters(ctx, x, y, width, height);

   }

   private applyCustomFilters(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number
   ): void {

      let imageData = ctx.getImageData(x, y, width, height);
      let data = imageData.data;

      let hsv = new hsvColor([0, 0, 0]);
      let grayScale = this.grayScale;
      for (let i = 0; i < data.length; i += 4) {
         if (grayScale) {
            let r = data[i + 0];
            let g = data[i + 1];
            let b = data[i + 2];
            let val = 0.299 * r + 0.587 * g + 0.114 * b;
            data[i + 0] = val;
            data[i + 1] = val;
            data[i + 2] = val;
         }

         hsv.fromHtmlValues(data[i + 0], data[i + 1], data[i + 2]);

         if (hsv.v <= this.black) {
            hsv.v = 0;
         }
         else if (hsv.v >= this.white) {
            hsv.v = 1;
         }
         else {
            if (hsv.v > this.midPt) {
               hsv.v = this.midValue + (1 - this.midValue) * (hsv.v - this.midPt) / (this.white - this.midPt);
            }
            else {
               hsv.v = 0 + this.midValue * ((hsv.v - this.black) / (this.midPt - this.black));
            }
         }


         let rgb = hsv.toRGBValues();

         data[i + 0] = rgb[0];
         data[i + 1] = rgb[1];
         data[i + 2] = rgb[2];
      }

      ctx.putImageData(imageData, x, y);
   }

}