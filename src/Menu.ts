export type MenuItemFunction = () => void;

enum MenuLocation {
   Below,
   Right,
}

/**
 * Common base classes for things that are menus - menubar, pulldown menu, etc
 */
class Menu {
   private parent: Menu;
   private children: Menu[] = [];

   // the div that is the container for menu items
   public div: HTMLDivElement;

   protected constructor(parent: Menu, id: string, className: string) {
      this.parent = parent;

      this.div = document.createElement('div');
      this.div.id = id;
      this.div.className = className;

      if (parent) {
         parent.div.appendChild(this.div);
      }

      if (!parent) {
         // if this is the root menu, add a global click handler for closing menus
         window.addEventListener('click', () => {
            let className = (<any>event.target).className;
            if (className !== 'Menu' && className !== 'MenuItem' && className != 'Menubar') {
               this.hideDown();
            }
         });

         window.addEventListener('touchstart', (event: TouchEvent) => {
            let className = (<any>event.target).className;
            if (className !== 'Menu' && className !== 'MenuItem' && className != 'Menubar') {
               this.hideDown();
            }
         });

      }
   }

   public show() {
      if (this.div.classList.contains('MenuShow') === false) {
         this.div.classList.add('MenuShow');
      }
   }

   public hide() {
      if (this.div.classList.contains('MenuShow')) {
         this.div.classList.remove('MenuShow');
      }
   }

   public hideUp() {
      let menu: Menu = this;
      while (menu.parent) {
         menu.hide();
         menu = menu.parent;
      }
   }

   public hideDown() {
      this.children.forEach((child) => {
         child.hide();
         child.hideDown();
      });
   }

   protected internalAddSubMenu(innerHtml: string, id: string, location: MenuLocation): SubMenu {

      let item = document.createElement('div');
      item.id = id + 'MenuItem';
      item.className = 'MenuItem';
      item.innerHTML = innerHtml;

      item.onclick = () => {

         this.showSubMenu(item, subMenu, location);
      }
      this.div.appendChild(item);

      let subMenu = new SubMenu(this, id);
      this.children.push(subMenu);
      return subMenu;
   }

   protected showSubMenu(menuItem: HTMLDivElement, subMenu: SubMenu, location: MenuLocation) {

      // position the menu off screen so that we can query it's height when
      // we make it visible. Then position it properly
      subMenu.div.style.left = -500 + 'px'
      subMenu.div.style.top = 0 + 'px'

      // hide sibling menus that are open
      this.hideDown();

      // show the desired submenu
      subMenu.show();

      // position the new menu
      if (location === MenuLocation.Below) {
         subMenu.div.style.left = menuItem.offsetLeft + 'px'
         subMenu.div.style.top = (menuItem.offsetTop + menuItem.offsetHeight) + 'px'
      }
      else if (location === MenuLocation.Right) {
         subMenu.div.style.left = (menuItem.offsetLeft + menuItem.offsetWidth) + 'px'
         let top = menuItem.offsetTop;
         if (top + subMenu.div.clientHeight > window.innerHeight) {
            top = window.innerHeight - subMenu.div.clientHeight;
         }
         subMenu.div.style.top = top + 'px'
      }
   }

   public addItem(text: string, callback: MenuItemFunction): HTMLDivElement {

      // create a div for this item
      let item = document.createElement('div');
      item.className = 'MenuItem';
      item.innerText = text;
      item.onclick = (event: Event) => {

         // hide open menus in our hierarchy
         this.hideUp();

         // fire the event
         callback();
      }
      this.div.appendChild(item);

      return item;
   }
}







/**
 * Horizontal menubar across the top of the screen
 */
export class Menubar extends Menu {
   public constructor(parent: HTMLElement) {
      super(null, 'Menubar', 'Menubar');
      parent.appendChild(this.div);
   }

   public addSubMenu(text: string, id: string): SubMenu {

      return this.internalAddSubMenu(text, id, MenuLocation.Below);
   }
}









/**
 * A child menu of a menu, i.e. the item that appears when you click on something in the menubar
 */
export class SubMenu extends Menu {

   public constructor(parent: Menu, id: string) {
      super(parent, id + 'Menu', 'Menu');
   }

   public addSubMenu(text: string, id: string): SubMenu {

      let spanId = id + 'Span';
      let subMenu = this.internalAddSubMenu(text + '<span id="' + spanId + '" style="float:right">></span>', id, MenuLocation.Right);

      let span = document.getElementById(spanId) as HTMLSpanElement;
      let div = span.parentElement as HTMLDivElement;
      div.onmouseenter = () => {
         this.showSubMenu(div, subMenu, MenuLocation.Right);
         this.hideDown();
         subMenu.show();
      };

      return subMenu;
   }
}