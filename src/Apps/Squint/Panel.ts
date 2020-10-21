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

      if (this.hasSavedSettings) {
         let savedSettings = this.settings as IPanelSettings;
         if (savedSettings.visible !== flag) {
            this.saveSettings();
         }
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
   }

   protected constructor(parent: HTMLElement, id: string, displayStyleForShowing = 'block', settingsKey?: string) {
      super(settingsKey);

      this.div = GUI.create('div', id, parent);
      this.displayStyleForShowing = displayStyleForShowing;
   }

   protected onSaveSettings(settings: IPanelSettings): void {
      super.onSaveSettings(settings);
      settings.visible = this.visible;
   }

   protected onRestoreSettings(settings: IPanelSettings): void {
      super.onRestoreSettings(settings);
      if (settings.visible !== undefined) {
         this.visible = settings.visible;
      }
   }
}