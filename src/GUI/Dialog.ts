import { GUI } from './GUI';

export type ShowHandler = () => void;
export type HideHandler = () => void;

export class Dialog {
   protected backgroundDiv: HTMLDivElement;
   protected dialogDiv: HTMLDivElement;

   public onShow: ShowHandler | null = null;
   public onHide: HideHandler | null = null;

   public get visible(): boolean {
      return (getComputedStyle(this.backgroundDiv).display !== 'none');
   }
   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.backgroundDiv.style.display = 'flex';
         if (this.onShow) {
            this.onShow();
         }
      }
      else {
         this.backgroundDiv.style.display = 'none';
         if (this.onHide) {
            this.onHide();
         }
      }
   }

   protected constructor(parent: HTMLDivElement, baseName: string) {
      this.backgroundDiv = GUI.create('div', baseName + 'DialogBackgroundDiv', parent);
      this.backgroundDiv.className = 'DialogBackgroundClass';

      this.dialogDiv = GUI.create('div', baseName + 'DialogDiv', this.backgroundDiv);
   }
}
