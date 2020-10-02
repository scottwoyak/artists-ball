import { GUI } from '../../GUI/GUI';

export abstract class ImageCanvas {
   protected canvas: HTMLCanvasElement;
   public zoom = 1;
   public xOffset = 0;
   public yOffset = 0;

   public contrast = 100;
   public brightness = 100;
   public saturate = 100;
   public blur = 0;
   public black = 0;
   public white = 1;
   public midPt = 0.5;
   public midValue = 0.5;
   public grayScale = false;

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

   abstract clear(): void;

   abstract draw(img: HTMLImageElement): void;
}