export type MenuItemFunction = () => void;

export class DropDownMenu {
   private menuDiv: HTMLDivElement;
   private id: string;

   public constructor(parent: HTMLElement, text: string, id: string) {
      this.id = id;

      let div = document.createElement('div');
      div.id = id + 'DropDown';
      div.className = 'DropDown';
      parent.appendChild(div);

      let menuButton = document.createElement('div');
      menuButton.innerText = text;
      menuButton.className = 'DropDownButton';
      menuButton.onclick = () => {
         this.menuDiv.classList.toggle("DropDownShow");
      }
      div.appendChild(menuButton);

      this.menuDiv = document.createElement('div');
      this.menuDiv.className = 'DropDownMenu';
      this.menuDiv.id = id + 'DropDownMenu';
      div.appendChild(this.menuDiv);


   }

   public addItem(text: string, callback: MenuItemFunction) {
      let item = document.createElement('div');
      item.id = this.id + 'DropDownMenuItem';
      item.className = 'DropDownMenuItem';
      item.innerText = text;
      item.onclick = () => {
         this.menuDiv.classList.toggle("DropDownShow");
         callback();
      }
      this.menuDiv.appendChild(item);

   }
}