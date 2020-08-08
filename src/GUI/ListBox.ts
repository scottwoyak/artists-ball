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
   private _items: IListBoxItem<T>[] = [];
   public onSelectedChanged: () => void;

   public get selected(): T {

      for (let i = 0; i < this._items.length; i++) {
         let item = this._items[i];
         if (item.div.classList.contains(STYLE_LIST_BOX_ITEM_SELECTED)) {
            return item.userData;
         }
      }

      return null;
   }

   public get items(): IListBoxItem<T>[] {
      return this._items;
   }

   public get enabled(): boolean {
      alert('Not Implemented Yet: ListBox.enabled');
      return false;
   }

   public set enabled(value: boolean) {
      alert('Not Implemented Yet: ListBox.enabled');
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
      let oldSelected = this.selected;

      let item = document.createElement('div');
      item.id = id ?? undefined;
      item.className = 'ListBoxItem';
      item.innerText = label;
      this.box.appendChild(item);

      item.onclick = () => {
         let oldSelected = this.selected;

         for (let i = 0; i < this._items.length; i++) {
            this._items[i].div.classList.remove(STYLE_LIST_BOX_ITEM_SELECTED);
         }
         item.classList.toggle(STYLE_LIST_BOX_ITEM_SELECTED);

         if (oldSelected !== this.selected) {
            if (this.onSelectedChanged) {
               this.onSelectedChanged();
            }
         }
      }

      this._items.push({
         div: item,
         userData: userData,
      });

      if (this.selected === null) {
         item.classList.add(STYLE_LIST_BOX_ITEM_SELECTED);
      }

      if (oldSelected !== this.selected) {
         if (this.onSelectedChanged) {
            this.onSelectedChanged();
         }
      }
   }

   public clear() {
      let oldSelected = this.selected;

      this.box.innerHTML = '';
      this._items = [];

      if (oldSelected !== this.selected) {
         if (this.onSelectedChanged) {
            this.onSelectedChanged();
         }
      }
   }

   public refresh() {
   }
}