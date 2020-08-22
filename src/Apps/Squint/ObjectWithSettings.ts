import { debug } from './SquintApp';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ISettings {
}

export class ObjectWithSettings {
   private settingsKey?: string;

   public get hasSavedSettings(): boolean {
      return (this.settingsKey !== undefined && localStorage.getItem(this.settingsKey) !== null);
   }

   protected constructor(settingsKey?: string) {

      this.settingsKey = settingsKey;
   }

   // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
   protected buildSettingsObj(_settings: ISettings): void {
   }

   public saveSettings(): void {
      if (this.settingsKey) {
         let settings = {};
         this.buildSettingsObj(settings);

         localStorage.setItem(this.settingsKey, JSON.stringify(settings));
      }
   }

   // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
   protected onRestore(settings: ISettings) {
   }

   public restoreSettings(): void {
      if (this.settingsKey) {
         let jsonStr = localStorage.getItem(this.settingsKey);
         if (jsonStr !== null) {
            try {
               let settings = JSON.parse(jsonStr);
               this.onRestore(settings);
            }
            catch (err) {
               debug('Cannot restore settings for \' + key + \'.\nValue is not JSON: ' + jsonStr);
            }
         }
      }
   }
}