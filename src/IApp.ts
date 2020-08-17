import { Menubar } from './GUI/Menu';

export interface IApp {
   create(parent: HTMLElement): void;
   dispose(): void;
   buildMenu(menubar: Menubar): void;
}