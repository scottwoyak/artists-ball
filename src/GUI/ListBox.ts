import { ICtrl } from "./ICtrl";

export interface IListBoxItem<T> {
   div: HTMLDivElement,
   userData: T,
}

enum StyleClasses {
   ListBoxClass = 'ListBoxClass',
   ListBoxItemClass = 'ListBoxItemClass',
   ListBoxItemSelectedClass = 'ListBoxItemSelectedClass',
}

export class ListBox<T = any> implements ICtrl {
   private box: HTMLDivElement;
   private _items: IListBoxItem<T>[] = [];
   public onSelectedChanged: () => void;

   public get selected(): T {

      for (let i = 0; i < this._items.length; i++) {
         let item = this._items[i];
         if (item.div.classList.contains(StyleClasses.ListBoxItemSelectedClass)) {
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
   public constructor(parent: HTMLElement, id?: string) {

      this.box = document.createElement('div');
      this.box.id = id;
      this.box.className = StyleClasses.ListBoxClass;
      parent.appendChild(this.box);

   }

   public addItem(text?: string, userData?: any, id?: string): HTMLDivElement {
      let oldSelected = this.selected;

      let item = document.createElement('div');
      item.id = id ?? undefined;
      item.className = StyleClasses.ListBoxItemClass;
      item.innerText = text;
      this.box.appendChild(item);

      item.onclick = () => {
         let oldSelected = this.selected;

         for (let i = 0; i < this._items.length; i++) {
            this._items[i].div.classList.remove(StyleClasses.ListBoxItemSelectedClass);
         }
         item.classList.toggle(StyleClasses.ListBoxItemSelectedClass);

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
         item.classList.add(StyleClasses.ListBoxItemSelectedClass);
      }

      if (oldSelected !== this.selected) {
         if (this.onSelectedChanged) {
            this.onSelectedChanged();
         }
      }

      return item;
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