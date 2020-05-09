import { ICtrl } from "./ICtrl";

/**
 * Interface for data passed to the Checkbox constructor
 */
export interface ICheckboxSetup {
   id?: string,
   label: string,
   checked?: () => boolean,
   oncheck?: (checkbox: Checkbox) => void,
}


export class Checkbox implements ICtrl {
   private box: HTMLInputElement;
   private getState: () => boolean;

   public get checked() {
      return this.box.checked;
   }

   /**
    * @param parent The parent html object.
    * @param setup The setup data object
    */
   public constructor(parent: HTMLElement, setup: ICheckboxSetup) {

      this.getState = setup.checked;

      let div = document.createElement('div');
      div.id = setup.id;
      div.className = 'CheckboxDiv';
      parent.appendChild(div);

      let label = document.createElement('label');
      label.id = setup.id + 'Label';
      label.className = 'CheckboxLabel';
      label.innerText = setup.label ?? '';
      div.appendChild(label);

      this.box = document.createElement('input');
      this.box.className = 'Checkbox';
      this.box.type = 'checkbox';
      this.box.id = setup.id + 'Checkbox';
      this.box.checked = setup.checked ? setup.checked() : false;
      this.box.onchange = () => {
         if (setup.oncheck) {
            setup.oncheck(this);
         }
      }
      label.appendChild(this.box);

      let mark = document.createElement('span');
      mark.className = 'Checkmark';
      mark.id = setup.id + 'Checkmark';
      label.appendChild(mark);
   }

   public refresh() {
      if (this.getState) {
         this.box.checked = this.getState();
      }
   }
}