import { SubMenu, Menubar } from "./Menu";
import { ViewerApp } from "./ViewerApp";
import { IApp } from "./IApp";
import { PathTracerApp } from "./PathTracerApp";

enum AppType {
   ArtistsBall,
   Viewer
}

export class Launcher {
   private div: HTMLDivElement;
   private app: IApp;
   private menubar: Menubar;

   public constructor() {
      this.launch(AppType.Viewer);
   }

   public launch(type: AppType) {

      if (this.app) {
         this.app.delete();
         this.app = null;
      }

      // clear out old content
      document.body.innerHTML = '';

      // create the main div
      this.div = document.createElement('div');
      document.body.appendChild(this.div);

      this.buildMenu();

      let query;
      if (window.location.search) {
         query = window.location.search.substr(1);
      }

      switch (type) {
         case AppType.ArtistsBall:
            document.title = 'Artist\'s Tools: Artist\'s Ball';
            this.app = new PathTracerApp(query);
            break;

         case AppType.Viewer:
            document.title = 'Artist\'s Tools: Viewer';
            this.app = new ViewerApp(query);
      }
      this.app.create(this.div);
      this.app.buildMenu(this.menubar);
   }

   private buildMenu() {

      let subMenu: SubMenu;
      this.menubar = new Menubar(this.div);
      subMenu = this.menubar.addSubMenu('Apps', 'Apps');
      subMenu.addItem('Viewer', () => this.launch(AppType.Viewer));
      subMenu.addItem('Artist\'s Ball', () => this.launch(AppType.ArtistsBall));
   }
}