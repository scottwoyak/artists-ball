import { IApp } from './IApp';
import { Menubar } from './GUI/Menu';
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

   public static get baseUrl(): string {
      let url = location.origin + location.pathname;
      if (url.endsWith('index.html')) {
         url = url.substr(0, url.length - 10);
      }
      if (url.endsWith('/') === false) {
         url += '/';
      }
      return url;
   }

   public constructor() {

      this.setFontSize();
      window.addEventListener('orientationchange', () => this.setFontSize());

      // default app type if one isn't specified via a URL parameter
      let type = AppType.Squint;

      // create the main div
      this.div = document.createElement('div');
      document.body.appendChild(this.div);

      this.menubar = new Menubar(this.div);
      let html = '<img style="width: 1em" src="' + Launcher.baseUrl + 'img/apps.svg' + '" />';
      const subMenu = this.menubar.addSubMenu(html, 'Apps');
      subMenu.addItem('3D Viewer', () => location.href = this.getUrl(AppType.Viewer));
      subMenu.addItem('Squint', () => location.href = this.getUrl(AppType.Squint));
      subMenu.addItem('Artist\'s Ball', () => location.href = this.getUrl(AppType.ArtistsBall));

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
      const base = location.href.split('?')[0];
      switch (type) {
         case AppType.ArtistsBall:
            return base + '?App=ArtistsBall';
            break;

         case AppType.Squint:
            return base + '?App=Squint';
            break;

         case AppType.Viewer:
            return base + '?App=Viewer';
            break;

         default:
            return base;
      }
   }

   private setFontSize() {
      // supposed to be able to do this stuff with media queries, but I give up! Browsers
      // behave differently on mobile devices and some alter scaling for portrait and
      // landscape too!
      const isMobile = (navigator.userAgent.indexOf('Mobile') > 0);
      const isFirefox = (navigator.userAgent.indexOf('Firefox') > 0);
      const isChome = (navigator.userAgent.indexOf('Chrome') > 0);
      const isPortrait = (window.orientation !== undefined && window.orientation === 0 || window.orientation === 180);
      const isIphone = (navigator.userAgent.indexOf('iPhone') > 0);

      let fontSize = 11;
      if (isFirefox) {
         fontSize = 11;
      }
      else {
         if (isMobile && isPortrait) {
            if (isIphone) {
               fontSize = 28;
            }
            else {
               fontSize = 24;
            }
         }
         else {
            if (isIphone) {
               fontSize = 16;
            }
            else {
               fontSize = 11;
            }
         }
      }

      // set the variable into the CSS code
      document.documentElement.style.setProperty('--fontSize', fontSize + 'pt');
   }
}