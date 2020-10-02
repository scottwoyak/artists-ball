import { GUI } from '../../GUI/GUI';
import { ObjectWithSettings, ISettings } from './ObjectWithSettings';

export interface IPanelSettings extends ISettings {
   visible?: boolean
}

export type VisibleHandler = (visible: boolean) => void;

export class Panel extends ObjectWithSettings {
   protected div: HTMLDivElement;
   private displayStyleForShowing: string;

   public onVisible: VisibleHandler = null;

   public get visible(): boolean {
      return (getComputedStyle(this.div).display !== 'none');
   }

   public set visible(flag: boolean) {
      if (flag === this.visible) {
         return;
      }

      if (flag) {
         this.div.style.display = this.displayStyleForShowing;
      }
      else {
         this.div.style.display = 'none';
      }

      if (this.onVisible) {
         this.onVisible(flag);
      }

      this.saveSettings();
   }

   protected constructor(parent: HTMLElement, id: string, displayStyleForShowing = 'block', settingsKey?: string) {
      super(settingsKey);

      this.div = GUI.create('div', id, parent);
      this.displayStyleForShowing = displayStyleForShowing;
   }

   protected buildSettingsObj(settings: IPanelSettings): void {
      super.buildSettingsObj(settings);
      settings.visible = this.visible;
   }

   protected onRestore(settings: IPanelSettings): void {
      super.onRestore(settings);
      if (settings.visible !== undefined) {
         this.visible = settings.visible;
      }
   }
}