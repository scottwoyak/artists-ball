import { ISliderSetup, Slider } from "./Slider";
import { Checkbox, ICheckboxSetup } from "./Checkbox";
import { ICtrl } from "./ICtrl";
import { IRadiobuttonSetup, Radiobutton } from "./Radiobutton";
import { isMobile } from "../Util/Globals";

export type MenuItemFunction = (item?: HTMLDivElement) => void;
export type MenuItemFunctionBool = (value: boolean) => void;

enum MenuLocation {
   Below,
   Right,
}

export interface IMenuItemOptions {
   closeOnClick: boolean;
}

/**
 * Common base classes for things that are menus - menubar, pulldown menu, etc
 */
class Menu {
   private parent: Menu;
   private children: Menu[] = [];
   private ctrls: ICtrl[] = [];

   // the div that is the container for menu items
   public div: HTMLDivElement;

   protected isMenuItem(element: HTMLElement): boolean {
      while (element) {
         if (element.className === 'MenuItem') {
            return true;
         }
         element = element.parentElement;
      }
      return false;
   }
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
         window.addEventListener('mousedown', () => {
            if (!this.isMenuItem(event.target as HTMLElement)) {
               this.hideDown();
            }
         });

         window.addEventListener('touchstart', (event: TouchEvent) => {
            if (!this.isMenuItem(event.target as HTMLElement)) {
               this.hideDown();
            }
         });

      }
   }

   public show() {
      this.ctrls.forEach((ctrl) => ctrl.refresh());
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
      let bodyRect = document.body.getBoundingClientRect();
      let menuItemRect = menuItem.getBoundingClientRect();
      let subMenuRect = subMenu.div.getBoundingClientRect();
      if (location === MenuLocation.Below) {
         subMenu.div.style.left = menuItemRect.left + 'px'
         subMenu.div.style.top = menuItemRect.bottom + 'px'
      }
      else if (location === MenuLocation.Right) {

         let left = menuItemRect.left + 0.5 * menuItemRect.width;
         if (left + subMenuRect.width > bodyRect.width) {
            left = menuItemRect.left - subMenuRect.width;
         }
         subMenu.div.style.left = left + 'px';

         let top = menuItemRect.top;
         if (top + subMenuRect.height > bodyRect.height) {
            top = bodyRect.height - subMenuRect.height;
         }
         subMenu.div.style.top = top + 'px'
      }
   }

   public addItem(text: string, callback: MenuItemFunction, options?: IMenuItemOptions): HTMLDivElement {

      // create a div for this item
      let item = document.createElement('div');
      item.className = 'MenuItem';
      item.innerText = text;
      item.onclick = (event: Event) => {

         // hide open menus in our hierarchy
         if (!(options && options.closeOnClick == false)) {
            this.hideUp();
         }

         // fire the event
         callback(item);
      }
      this.div.appendChild(item);

      item.onmouseenter = () => {
         this.hideDown();
      }

      return item;
   }

   public addSlider(setup: ISliderSetup): Slider {
      let div = this.addItem(
         setup.label,
         () => { }, // do nothing on click
         { closeOnClick: false }
      );

      let ctrl = new Slider(div, {
         id: setup.id,
         label: '',
         min: setup.min,
         max: setup.max,
         value: setup.value,
         oninput: setup.oninput,
      });
      this.ctrls.push(ctrl);

      return ctrl;
   }

   public addCheckbox(setup: ICheckboxSetup): Checkbox {
      let div = this.addItem(
         '',
         () => { }, // do nothing on click
         { closeOnClick: false }
      );

      let ctrl = new Checkbox(div, setup);
      this.ctrls.push(ctrl);

      return ctrl;
   }

   public addRadiobutton(setup: IRadiobuttonSetup): Radiobutton {
      let div = this.addItem(
         '',
         () => { }, // do nothing on click
         { closeOnClick: false }
      );

      let ctrl = new Radiobutton(div, setup);
      this.ctrls.push(ctrl);

      return ctrl;
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

   public addSubMenu(text: string, id?: string): SubMenu {

      return this.internalAddSubMenu(text, id ?? (text + 'Menu'), MenuLocation.Below);
   }
}









/**
 * A child menu of a menu, i.e. the item that appears when you click on something in the menubar
 */
export class SubMenu extends Menu {

   public constructor(parent: Menu, id: string) {
      super(parent, id + 'Menu', 'Menu');
   }

   public addSubMenu(text: string, id?: string): SubMenu {

      if (!id) {
         id = text.replace(/\s+/g, '');
      }

      let spanId = id + 'Span';
      let subMenu = this.internalAddSubMenu(text + '<span id="' + spanId + '" style="float:right">></span>', id, MenuLocation.Right);

      let span = document.getElementById(spanId) as HTMLSpanElement;
      let div = span.parentElement as HTMLDivElement;
      div.onmouseenter = () => {
         if (isMobile === false) {
            // TODO this event is triggering on a touchscreen laptop when we don't want it to.
            this.hideDown();
            this.showSubMenu(div, subMenu, MenuLocation.Right);
         }
      };

      return subMenu;
   }
}