import { GUI } from '../../GUI/GUI';

export class Panel {
   protected div: HTMLDivElement;
   private displayStyleForShowing: string;

   public get visible(): boolean {
      return (getComputedStyle(this.div).display !== 'none');
   }

   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.div.style.display = this.displayStyleForShowing;
      }
      else {
         this.div.style.display = 'none';
      }
   }

   protected constructor(parent: HTMLElement, id: string, displayStyleForShowing = 'block') {

      this.div = GUI.create('div', id, parent);
      this.displayStyleForShowing = displayStyleForShowing;
   }
}