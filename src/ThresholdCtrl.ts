import { PlanesApp } from "./PlanesApp";

// TODO make these variables
export let textureSize = 256;
export let displaySize = 150;

export class ThresholdCtrl {
   private canvas: HTMLCanvasElement;
   private hiddenCanvas: HTMLCanvasElement;
   private app: PlanesApp;

   public constructor(parent: HTMLElement, app: PlanesApp) {

      this.app = app;
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'ThresholdCanvas';
      this.canvas.width = displaySize;
      this.canvas.height = displaySize;

      parent.appendChild(this.canvas);

      this.hiddenCanvas = document.createElement('canvas');
      this.hiddenCanvas.width = textureSize;
      this.hiddenCanvas.height = textureSize;
      this.hiddenCanvas.style.display = 'none';
      parent.appendChild(this.hiddenCanvas);
   }

   public draw() {

      let pixels = new Uint8ClampedArray(this.app.renderer.renderBall());
      let image = new ImageData(pixels, textureSize, textureSize);

      this.hiddenCanvas.getContext('2d').putImageData(image, 0, 0);

      let ctx = this.canvas.getContext('2d');
      ctx.putImageData(image, 0, 0);

      ctx.resetTransform();
      ctx.translate(0, displaySize / 2);
      ctx.scale(displaySize / textureSize, -displaySize / textureSize);
      ctx.drawImage(this.hiddenCanvas, 0, -textureSize / 2);
   }
}