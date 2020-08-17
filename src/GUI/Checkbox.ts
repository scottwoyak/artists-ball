import { ICtrl } from './ICtrl';
import { getBooleanValue } from '../Util/Globals';

/**
 * Interface for data passed to the Checkbox constructor
 */
export interface ICheckboxSetup {
   id?: string,
   label: string,
   checked?: boolean | (() => boolean),
   oncheck?: (checkbox: Checkbox) => void,
}


export class Checkbox implements ICtrl {
   private box: HTMLInputElement;
   private getState: (() => boolean) | undefined;

   public get checked(): boolean {
      return this.box.checked;
   }
   public set checked(value: boolean) {
      this.box.checked = value;
   }

   public get enabled(): boolean {
      return !this.box.disabled;
   }

   public set enabled(value: boolean) {
      this.box.disabled = !value;
   }

   /**
    * @param parent The parent html object.
    * @param setup The setup data object
    */
   public constructor(parent: HTMLElement, setup: ICheckboxSetup) {

      if (typeof setup.checked === 'function') {
         this.getState = setup.checked;
      }

      const div = document.createElement('div');
      if (setup.id) {
         div.id = setup.id;
      }
      div.className = 'CheckboxDiv';
      parent.appendChild(div);

      const label = document.createElement('label');
      label.id = setup.id + 'Label';
      label.className = 'CheckboxLabel';
      label.innerText = setup.label ?? '';
      div.appendChild(label);

      this.box = document.createElement('input');
      this.box.className = 'Checkbox';
      this.box.type = 'checkbox';
      this.box.id = setup.id + 'Checkbox';
      this.box.checked = getBooleanValue(setup.checked);
      this.box.onchange = () => {
         if (setup.oncheck) {
            setup.oncheck(this);
         }
      }
      label.appendChild(this.box);

      const mark = document.createElement('span');
      mark.className = 'Checkmark';
      mark.id = setup.id + 'Checkmark';
      label.appendChild(mark);
   }

   public refresh(): void {
      if (this.getState) {
         this.box.checked = this.getState();
      }
   }
}