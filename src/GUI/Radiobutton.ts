import { ICtrl } from "./ICtrl";
import { getBooleanValue } from "../Util/Globals";

type BooleanFunc = () => boolean;

/**
 * Interface for data passed to the Radiobutton constructor
 */
export interface IRadiobuttonSetup {
   id?: string,
   label: string,
   group: string,
   checked?: boolean | (() => boolean),
   oncheck?: (radio: Radiobutton) => void,
   onuncheck?: (radio: Radiobutton) => void,
}

export class Radiobutton implements ICtrl {
   private box: HTMLInputElement;
   private getState: () => boolean;

   public get checked() {
      return this.box.checked;
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
   public constructor(parent: HTMLElement, setup: IRadiobuttonSetup) {

      let id = setup.id ?? 'Radiobutton';
      if (typeof setup.checked === 'function') {
         this.getState = setup.checked;
      }

      let div = document.createElement('div');
      div.id = id;
      div.className = 'RadiobuttonDiv';
      parent.appendChild(div);

      let label = document.createElement('label');
      label.id = id + 'Label';
      label.className = 'RadiobuttonLabel';
      label.innerText = setup.label ?? '';
      div.appendChild(label);

      this.box = document.createElement('input');
      this.box.className = 'Radiobutton';
      this.box.type = 'radio';
      this.box.name = setup.group;
      this.box.id = id + 'Radiobutton';
      this.box.checked = getBooleanValue(setup.checked);
      this.box.onchange = () => {
         if (this.box.checked) {
            if (setup.oncheck) {
               setup.oncheck(this);
            }
         }
         else {
            if (setup.onuncheck) {
               setup.onuncheck(this);
            }
         }
      }
      label.appendChild(this.box);

      let mark = document.createElement('span');
      mark.className = 'RadioCheckmark';
      mark.id = id + 'RadioCheckmark';
      label.appendChild(mark);
   }

   public check(value: boolean = true) {
      this.box.checked = value;
   }

   public refresh() {
      if (this.getState) {
         this.box.checked = this.getState();
      }
   }
}