import { Menubar } from "./Menu";

export interface IApp {
   create(parent: HTMLElement): void;
   delete(): void;
   buildMenu(menubar: Menubar): void;
}