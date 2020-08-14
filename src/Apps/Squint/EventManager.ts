type EventHandler = (...args: any[]) => void;

export class EventManager {

   private handlers = new Map<string, EventHandler[]>();

   public on(name: string, handler: EventHandler) {
      let arr = this.handlers.get(name);

      if (arr) {
         arr.push(handler);
      }
      else {
         let arr = [];
         arr.push(handler);
         this.handlers.set(name, arr);
      }
   }

   public remove(name: string, handler: EventHandler) {
      let arr = this.handlers.get(name);

      if (arr) {
         arr = arr.filter((elem) => elem != handler);
         this.handlers.set(name, arr);
      }
   }

   public emit(name: string, ...args: any[]) {
      let arr = this.handlers.get(name);
      if (arr) {
         for (let handler of arr) {
            try {
               handler(args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[7], args[8], args[9]);
            }
            catch (err) {
               console.error('Unhandled exception: ' + err);
            }
         }
      }
   }
}