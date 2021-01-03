
export class GUI {
   public static create<K extends keyof HTMLElementTagNameMap>(
      type: K,
      id: string,
      parent: HTMLElement,
      className?: string
   ): HTMLElementTagNameMap[K] {
      const elem = document.createElement(type);
      elem.id = id;
      parent.appendChild(elem);
      if (className) {
         elem.className = className;
      }
      return elem;
   }

   public static createAnimation(id: string, parent: HTMLElement): HTMLDivElement {
      const div = document.createElement('div');
      div.id = id;
      div.className = 'lds-ring';
      div.appendChild(document.createElement('div'));
      div.appendChild(document.createElement('div'));
      div.appendChild(document.createElement('div'));
      div.appendChild(document.createElement('div'));
      parent.appendChild(div);
      return div;
   }

   public static drawHandle(ctx: CanvasRenderingContext2D, x: number, y: number, outerRadius: number): void {

      ctx.fillStyle = 'lightgreen';
      ctx.strokeStyle = 'darkgreen'

      ctx.beginPath();
      let lineWidth = outerRadius / 10;
      ctx.lineWidth = lineWidth;
      ctx.arc(x, y, outerRadius - lineWidth / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

   }
}

