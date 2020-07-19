import { Stopwatch } from "./Stopwatch";
import { FPS } from "./FPS";
import { Squint } from "./Squint";

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   public onDataNeeded: DataNeededHandler;
   public uploadTime: number;
   public fps = new FPS();

   private running = false;
   private handle: number;
   private squint = new Squint();
   private id: string;

   public start(id: string) {
      this.id = id;
      this.handle = requestAnimationFrame(() => this.upload());
      this.running = true;
   }

   public stop() {
      cancelAnimationFrame(this.handle);
      this.running = false;
   }

   private upload() {
      if (!this.onDataNeeded) {
         return;
      }

      this.fps.tick();
      this.onDataNeeded()
         .then((blob: Blob) => {
            if (blob === null) {
               return Promise.reject('Invalid Blob (null)');
            }

            //console.log('upload size: ' + blob.size / (1024 * 1024));
            let url = URL.createObjectURL(blob);
            let fd = new FormData();
            fd.append('image', blob);

            // TODO limit to one call at a time
            let sw = new Stopwatch();
            this.squint.put(this.id, fd)
               .then(() => {
                  console.log('upload time: ' + sw.elapsedMs);
                  this.uploadTime = sw.elapsedMs;
               })
               .catch((reason) => {
                  console.log('Upload failure for [' + Squint.url + '] ' + reason);
               })
               .finally(() => {
                  URL.revokeObjectURL(url);
                  if (this.running) {
                     this.handle = requestAnimationFrame(() => this.upload());
                  }
               });
         })
   }
}