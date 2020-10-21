import { debug } from './SquintApp';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISettings {
}

export class ObjectWithSettings {
   private settingsKey?: string;

   public get hasSavedSettings(): boolean {
      return (this.settingsKey !== undefined && localStorage.getItem(this.settingsKey) !== null);
   }

   public get settings(): ISettings {
      if (this.settingsKey === undefined) {
         return null;
      }
      else {
         let settings = localStorage.getItem(this.settingsKey);
         if (settings) {
            try {
               // eslint-disable-next-line @typescript-eslint/no-unsafe-return
               return JSON.parse(settings);
            }
            catch (err) {
               return null;
            }
         }
      }
   }

   protected constructor(settingsKey?: string) {

      this.settingsKey = settingsKey;
   }

   // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
   protected onSaveSettings(_settings: ISettings): void {
   }

   // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
   protected onRestoreSettings(settings: ISettings) {
   }

   public saveSettings(): void {
      if (this.settingsKey) {
         let settings = {};
         this.onSaveSettings(settings);

         localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      }
   }

   public restoreSettings(): void {
      if (this.settingsKey) {
         let jsonStr = localStorage.getItem(this.settingsKey);
         if (jsonStr !== null) {
            try {
               let settings = JSON.parse(jsonStr);
               this.onRestoreSettings(settings);
            }
            catch (err) {
               debug('Cannot restore settings for \' + key + \'.\nValue is not JSON: ' + jsonStr);
            }
         }
      }
   }
}