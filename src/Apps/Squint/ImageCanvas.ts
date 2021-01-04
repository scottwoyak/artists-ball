import { GUI } from '../../GUI/GUI';
import { hsvColor } from '../../Util/hsvColor';
import { ImageFilter } from './ImageFilter';

export class ImageCanvas {
   protected canvas: HTMLCanvasElement;
   public zoom = 1;
   public xOffset = 0;
   public yOffset = 0;

   public chroma = 100;
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

      if (isNaN(this.numLevels) === false) {
         let blurSize = Math.min(3, 30 / this.numLevels);
         ctx.filter = 'blur(' + blurSize + 'px)';
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

      if (this.chroma !== 100) {
         ImageFilter.chroma(imageData, this.chroma);
      }

      if (this.black !== 0 || this.midPt !== 0.5 || this.midValue !== 0.5 || this.white !== 1 || isNaN(this.numLevels) === false) {
         ImageFilter.levels(imageData, this.white, this.black, this.midPt, this.midValue, this.numLevels);
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