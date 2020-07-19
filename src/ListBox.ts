import { ICtrl } from "./ICtrl";

/**
 * Interface for data passed to the ListBox constructor
 */
export interface IListBoxSetup {
   id?: string,
}

export interface IListBoxItem<T> {
   div: HTMLDivElement,
   userData: T,
}

const STYLE_LIST_BOX_ITEM_SELECTED = 'ListBoxItemSelected';

export class ListBox<T = any> implements ICtrl {
   private box: HTMLDivElement;
   private items: IListBoxItem<T>[] = [];

   public get selected(): T {

      for (let i = 0; i < this.items.length; i++) {
         let item = this.items[i];
         if (item.div.classList.contains(STYLE_LIST_BOX_ITEM_SELECTED)) {
            return item.userData;
         }
      }

      return null;
   }

   /**
    * @param parent The parent html object.
    * @param setup The setup data object
    */
   public constructor(parent: HTMLElement, setup: IListBoxSetup) {

      this.box = document.createElement('div');
      this.box.id = setup.id;
      this.box.className = 'ListBox';
      parent.appendChild(this.box);

   }

   public addItem(label: string, userData?: any, id?: string) {
      let item = document.createElement('div');
      item.id = id ?? undefined;
      item.className = 'ListBoxItem';
      item.innerText = label;
      this.box.appendChild(item);

      if (this.selected === null) {
         item.classList.add(STYLE_LIST_BOX_ITEM_SELECTED);
      }

      item.onclick = () => {
         for (let i = 0; i < this.items.length; i++) {
            this.items[i].div.classList.remove(STYLE_LIST_BOX_ITEM_SELECTED);
         }
         item.classList.toggle(STYLE_LIST_BOX_ITEM_SELECTED);
      }

      this.items.push({
         div: item,
         userData: userData,
      });
   }

   public clear() {
      this.box.innerHTML = '';
      this.items = [];
   }

   public refresh() {
   }
}