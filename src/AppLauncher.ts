import { SubMenu, Menubar } from "./Menu";
import { ViewerApp } from "./ViewerApp";
import { IApp } from "./IApp";
import { PathTracerApp } from "./PathTracerApp";
import { ValuePlanesApp } from "./ValuePlanesApp";

enum AppType {
   ArtistsBall,
   ValuePlanes,
   Viewer
}

export class AppLauncher {
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
            this.app = new PathTracerApp('');
            break;

         case AppType.ValuePlanes:
            document.title = 'Artist\'s Tools: Value Planes';
            this.app = new ValuePlanesApp(query ?? 'Pose_02.blob');
            break;

         case AppType.Viewer:
            document.title = 'Artist\'s Tools: Viewer';
            this.app = new ViewerApp(query ?? 'Pose_01.blob');
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
      subMenu.addItem('Value Planes', () => this.launch(AppType.ValuePlanes));

   }
}