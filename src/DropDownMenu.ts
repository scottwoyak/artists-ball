export type MenuItemFunction = () => void;

class Menu {
   public menuDiv: HTMLDivElement;
   public ignoreEvent = false;

   protected constructor() {
   }

   public show() {
      if (this.menuDiv.classList.contains('DropDownShow') === false) {
         this.menuDiv.classList.add('DropDownShow');
      }
   }

   public hide() {
      if (this.menuDiv.classList.contains('DropDownShow')) {
         this.menuDiv.classList.remove('DropDownShow');
      }
   }

   protected addCloseHandler() {
      // TODO on the phone this event does not occur when clicking over the canvas

      window.addEventListener('click', (event) => {
         if (this.ignoreEvent === false) {
            this.hide();
         }
         this.ignoreEvent = false;
      });
   }
}

export class DropDownMenu extends Menu {
   private dropDownDiv: HTMLDivElement;
   private id: string;

   public constructor(parent: HTMLElement, text: string, id: string) {
      super();

      this.id = id;

      this.dropDownDiv = document.createElement('div');
      this.dropDownDiv.id = id + 'DropDown';
      this.dropDownDiv.className = 'DropDown';
      parent.appendChild(this.dropDownDiv);

      let menuButton = document.createElement('div');
      menuButton.innerText = text;
      menuButton.className = 'DropDownButton';
      menuButton.onclick = () => {
         this.ignoreEvent = true;
         this.show();
      }
      this.dropDownDiv.appendChild(menuButton);

      super.addCloseHandler();


      this.menuDiv = document.createElement('div');
      this.menuDiv.className = 'DropDownMenu';
      this.menuDiv.id = id + 'DropDownMenu';
      this.dropDownDiv.appendChild(this.menuDiv);
   }

   public addItem(text: string, callback: MenuItemFunction) {
      let item = document.createElement('div');
      item.id = this.id + 'DropDownMenuItem';
      item.className = 'DropDownMenuItem';
      item.innerText = text;
      item.onclick = () => {
         callback();
      }
      this.menuDiv.appendChild(item);
   }

   public addSubMenu(text: string, id: string): SubMenu {

      let item = document.createElement('div');
      item.id = this.id + 'DropDownMenuItem';
      item.className = 'DropDownMenuItem';
      item.innerText = text;
      item.onclick = () => {
         this.hide();
         subMenu.show();
         subMenu.ignoreEvent = true;
      }
      this.menuDiv.appendChild(item);

      let subMenu = new SubMenu(item, this.dropDownDiv, id);
      return subMenu;
   }
}

export class SubMenu extends Menu {
   private id: string;

   public constructor(parent: HTMLDivElement, dropDownDiv: HTMLDivElement, id: string) {
      super();

      this.id = id
      this.menuDiv = document.createElement('div');
      this.menuDiv.className = 'DropDownMenu';
      this.menuDiv.id = id + 'DropDownMenu';
      dropDownDiv.appendChild(this.menuDiv);

      this.addCloseHandler();
   }

   public addItem(text: string, callback: MenuItemFunction) {
      let item = document.createElement('div');
      item.id = this.id + 'DropDownMenuItem';
      item.className = 'DropDownMenuItem';
      item.innerText = text;
      item.onclick = () => {
         this.ignoreEvent = true;
         // TODO the global handler should get this but does not on phones
         this.hide();
         callback();
      }
      this.menuDiv.appendChild(item);
   }
}