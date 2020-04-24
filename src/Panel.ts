export type PanelShowHideFunction = (panel: Panel) => void;

export class Panel {

   public readonly div: HTMLDivElement;
   public onShow: PanelShowHideFunction;
   public onHide: PanelShowHideFunction;

   public get visible(): boolean {
      return getComputedStyle(this.div).display === 'block';
   }

   public set visible(value: boolean) {
      if (value !== this.visible) {
         this.div.style.display = value ? 'block' : 'none';

         if (value) {
            if (this.onShow) {
               this.onShow(this);
            }
         }
         else {
            if (this.onHide) {
               this.onHide(this);
            }
         }
      }
   }

   public constructor(parent: HTMLElement, id: string) {
      this.div = document.createElement('div');
      this.div.id = id;
      this.div.className = 'Panel';
      this.div.classList.add('Container');

      parent.appendChild(this.div);

      let exitButton = document.createElement('div');
      exitButton.id = 'ExitButton';
      exitButton.className = 'DivButton';
      exitButton.innerText = 'X';
      exitButton.onclick = () => {
         this.visible = false;
      }
      this.div.appendChild(exitButton);
   }
}