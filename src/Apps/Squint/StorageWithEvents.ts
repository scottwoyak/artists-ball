import { EventManager } from './EventManager';

export enum StorageItem {
   UserName = 'UserName'
}

export type StorageItemChangeHandler = (value: string, oldValue: string) => void;

export class StorageWithEvents {
   private eventManager = new EventManager();

   public on(item: string, handler: StorageItemChangeHandler): void {
      this.eventManager.on(item, handler);
   }

   public set(item: StorageItem, value: string): void {

      let oldValue = localStorage.getItem(item);

      localStorage.setItem(item, value);

      if (value !== oldValue) {
         this.eventManager.emit(item, value, oldValue);
      }
   }

   public get(item: StorageItem): string {
      return localStorage.getItem(item);
   }

   public has(item: StorageItem): boolean {
      return this.get(item) !== null;
   }
}