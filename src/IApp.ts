import { Menubar } from './GUI/Menu';

export interface IApp {
   create(parent: HTMLElement): void;
   buildMenu(menubar: Menubar): void;
}