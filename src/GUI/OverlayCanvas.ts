export enum TextLocation {
   Center,
   TopLeft,
   TopRight,
   BottomLeft,
   BottomRight
}

export class OverlayCanvas {
   private canvas: HTMLCanvasElement;
   private smallFont: string;
   private largeFont: string;

   public get height(): number {
      return this.canvas.height;
   }
   public set height(value: number) {
      this.canvas.height = value;
   }

   public get width(): number {
      return this.canvas.width;
   }
   public set width(value: number) {
      this.canvas.width = value;
   }

   public get context(): CanvasRenderingContext2D {
      const context = this.canvas.getContext('2d');
      if (context === null) {
         throw new Error('Internal Error: context=null');
      }
      return context;
   }

   public constructor(parent: HTMLElement, id?: string) {
      this.canvas = document.createElement('canvas');
      if (id) {
         this.canvas.id = id;
      }
      this.canvas.className = 'Overlay';
      parent.appendChild(this.canvas);

      const dummy = document.createElement('div');
      parent.appendChild(dummy);
      dummy.className = 'Overlay'
      this.largeFont = getComputedStyle(dummy).font;
      dummy.className = 'OverlayAnnotation';
      this.smallFont = getComputedStyle(dummy).font;
      parent.removeChild(dummy);
   }

   public clear(): void {
      this.context.clearRect(0, 0, this.width, this.height);
   }

   public fillText(msg: string, location: TextLocation = TextLocation.Center): void {
      const ctx = this.context;

      const style = getComputedStyle(this.canvas);
      ctx.fillStyle = style.color;

      let x: number;
      let y: number;

      switch (location) {
         case TextLocation.Center:
            ctx.font = this.largeFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            x = this.width / 2;
            y = this.height / 2;
            break;

         case TextLocation.BottomLeft:
            ctx.font = this.smallFont;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            x = 0;
            y = this.height;
            break;

         case TextLocation.BottomRight:
            ctx.font = this.smallFont;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            x = this.width;
            y = this.height;
            break;

         case TextLocation.TopLeft:
            ctx.font = this.smallFont;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            x = 0;
            y = 0;
            break;

         case TextLocation.TopRight:
            ctx.font = this.smallFont;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'top';
            x = this.width;
            y = 0;
            break;
      }
      ctx.fillText(msg, x, y);
   }
}