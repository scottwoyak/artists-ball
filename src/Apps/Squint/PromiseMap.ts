import { debug } from './SquintApp';

export type ResolveHandler = () => void;
export type RejectHandler = (err: string) => void;

class PromiseData {
   public timeoutHandle: number;
   public resolve: ResolveHandler;
   public reject: RejectHandler;

   public constructor(
      timeoutHandle: number,
      resolve: ResolveHandler,
      reject: RejectHandler
   ) {
      this.timeoutHandle = timeoutHandle;
      this.resolve = resolve;
      this.reject = reject;
   }
}

export class PromiseMap {
   map: Map<string, PromiseData> = new Map();

   public put(
      id: string,
      timeoutMs: number,
      resolve: ResolveHandler,
      reject: RejectHandler,
      rejectMessage: string

   ): void {
      let handle = window.setTimeout(() => {
         let req = this.map.get(id);
         req.timeoutHandle = null;
         this.reject(id, rejectMessage);
      }, timeoutMs);

      let req = new PromiseData(handle, resolve, reject);
      this.map.set(id, req);
   }

   private extract(id: string): PromiseData {
      let req = this.map.get(id);
      if (req === undefined) {
         debug('Internal Error: request not found');
         throw new Error('request not found');
      }

      this.map.delete(id);

      if (req.timeoutHandle !== null) {
         window.clearTimeout(req.timeoutHandle);
         req.timeoutHandle = null;
      }
      return req;
   }

   public reject(id: string, err: string): void {
      if (this.map.has(id)) {
         this.extract(id).reject(err);
      }
   }

   public resolve(id: string): void {
      if (this.map.has(id)) {
         this.extract(id).resolve();
      }
   }
}