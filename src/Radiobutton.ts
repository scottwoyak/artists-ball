import { ICtrl } from "./ICtrl";

/**
 * Interface for data passed to the Radiobutton constructor
 */
export interface IRadiobuttonSetup {
   id?: string,
   label: string,
   group: string,
   checked?: () => boolean,
   oncheck?: (radio: Radiobutton) => void,
   onuncheck?: (radio: Radiobutton) => void,
}


export class Radiobutton implements ICtrl {
   private box: HTMLInputElement;
   private getState: () => boolean;

   public get checked() {
      return this.box.checked;
   }

   /**
    * @param parent The parent html object.
    * @param setup The setup data object
    */
   public constructor(parent: HTMLElement, setup: IRadiobuttonSetup) {

      this.getState = setup.checked;

      let div = document.createElement('div');
      div.id = setup.id;
      div.className = 'RadiobuttonDiv';
      parent.appendChild(div);

      let label = document.createElement('label');
      label.id = setup.id + 'Label';
      label.className = 'RadiobuttonLabel';
      label.innerText = setup.label ?? '';
      div.appendChild(label);

      this.box = document.createElement('input');
      this.box.className = 'Radiobutton';
      this.box.type = 'radio';
      this.box.name = setup.group;
      this.box.id = setup.id + 'Radiobutton';
      this.box.checked = setup.checked ? setup.checked() : false;
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
      mark.id = setup.id + 'RadioCheckmark';
      label.appendChild(mark);
   }

   public refresh() {
      if (this.getState) {
         this.box.checked = this.getState();
      }
   }
}