import { ICtrl } from "./ICtrl";

/**
 * Interface for data passed to the Checkbox constructor
 */
export interface IButtonSetup {
   id?: string,
   label: string,
   onclick?: () => void,
}


export class Button implements ICtrl {
   private button: HTMLButtonElement;


   public get enabled(): boolean {
      return !this.button.disabled;
   }

   public set enabled(value: boolean) {
      this.button.disabled = !value;
   }

   /**
    * @param parent The parent html object.
    * @param setup The setup data object
    */
   public constructor(parent: HTMLElement, setup: IButtonSetup) {

      let div = document.createElement('div');
      div.id = setup.id ?? 'Button';
      div.className = 'ButtonDiv';
      parent.appendChild(div);

      this.button = document.createElement('button');
      this.button.className = 'Button';
      this.button.type = 'button';
      this.button.id = setup.id + 'Button';
      this.button.innerText = setup.label;
      this.button.onclick = () => {
         if (setup.onclick) {
            setup.onclick();
         }
      }
      div.appendChild(this.button);
   }

   public refresh() {
   }
}