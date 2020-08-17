import { IApp } from './IApp';
import { Menubar, SubMenu } from './GUI/Menu';
import { PathTracerApp } from './Apps/PathTracer/PathTracerApp';
import { ViewerApp } from './Apps/Viewer/ViewerApp';
import { SquintApp } from './Apps/Squint/SquintApp';

enum AppType {
   ArtistsBall = 'ArtistsBall',
   Viewer = 'Viewer',
   Squint = 'Squint'
}

interface IParam {
   name: string,
   value: string,
}

export class Launcher {
   private div: HTMLDivElement | undefined;
   private app: IApp | null = null;
   private menubar: Menubar | undefined;

   public constructor() {
      // default app type if one isn't specified via a URL parameter
      let type = AppType.Squint;

      // create the main div
      this.div = document.createElement('div');
      document.body.appendChild(this.div);

      this.menubar = new Menubar(this.div);
      const subMenu = this.menubar.addSubMenu('Apps', 'Apps');
      subMenu.addItem('3D Viewer', () => location.replace(this.getUrl(AppType.Viewer)));
      subMenu.addItem('Squint', () => location.replace(this.getUrl(AppType.Squint)));
      subMenu.addItem('Artist\'s Ball', () => location.replace(this.getUrl(AppType.ArtistsBall)));

      const paramString = location.href.split('?')[1];
      const query = new URLSearchParams(paramString);

      // TODO this can be done without a switch statement, but I
      // don't have time right now to figure out how to make it
      // work with strict TypeScript and ESLint
      const appTypeStr = query.get('App');
      switch (appTypeStr) {
         case AppType.ArtistsBall:
            type = AppType.ArtistsBall;
            break;

         case AppType.Squint:
            type = AppType.Squint;
            break;

         case AppType.Viewer:
            type = AppType.Viewer;
            break;
      }
      query.delete('App');

      const file = this.getFileFromQuery(query);

      switch (type) {
         case AppType.ArtistsBall:
            document.title = 'Artist\'s Tools: Artist\'s Ball';
            this.app = new PathTracerApp(file);
            break;

         case AppType.Viewer:
            document.title = 'Artist\'s Tools: Viewer';
            this.app = new ViewerApp(file);
            break;

         case AppType.Squint:
            document.title = 'Squint';
            this.app = new SquintApp();
            break;
      }
      this.app.create(this.div);
      this.app.buildMenu(this.menubar);
   }

   private getFileFromQuery(query: URLSearchParams): string {
      const params: IParam[] = [];
      query.forEach((value: string, key: string) => {
         params.push({
            name: key,
            value,
         })
      })

      if (params.length === 1) {
         return params[0].name; // unnamed parameter
      }
      else {
         return '';
      }
   }

   private getUrl(type: AppType): string {
      const origin = location.origin
      switch (type) {
         case AppType.ArtistsBall:
            return origin + '?App=ArtistsBall';
            break;

         case AppType.Squint:
            return origin + '?App=Squint';
            break;

         case AppType.Viewer:
            return origin + '?App=Viewer';
            break;

         default:
            return origin;
      }
   }
}