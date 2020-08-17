import { IApp } from './IApp';
import { Menubar, SubMenu } from './GUI/Menu';
import { PathTracerApp } from './Apps/PathTracer/PathTracerApp';
import { ViewerApp } from './Apps/Viewer/ViewerApp';
import { SquintApp } from './Apps/Squint/SquintApp';

enum AppType {
   ArtistsBall,
   Viewer,
   Squint
}

export class Launcher {
   private div: HTMLDivElement | undefined;
   private app: IApp | null = null;
   private menubar: Menubar | undefined;

   public constructor() {
      this.launch(AppType.Squint);
   }

   public launch(type: AppType): void {

      if (this.app) {
         this.app.dispose();
         this.app = null;
      }

      // clear out old content
      document.body.innerHTML = '';

      // create the main div
      this.div = document.createElement('div');
      document.body.appendChild(this.div);

      this.menubar = new Menubar(this.div);
      const subMenu = this.menubar.addSubMenu('Apps', 'Apps');
      subMenu.addItem('3D Viewer', () => this.launch(AppType.Viewer));
      subMenu.addItem('Squint', () => this.launch(AppType.Squint));
      subMenu.addItem('Artist\'s Ball', () => this.launch(AppType.ArtistsBall));

      let query = '';
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
            break;

         case AppType.Squint:
            document.title = 'Squint';
            this.app = new SquintApp();
            break;
      }
      this.app.create(this.div);
      this.app.buildMenu(this.menubar);
   }
}