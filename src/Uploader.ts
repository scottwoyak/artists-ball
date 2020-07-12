import { Stopwatch } from "./Stopwatch";
import { FPS } from "./FPS";

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   public url: string;
   public onDataNeeded: DataNeededHandler;
   public uploadTime: number;
   public fps = new FPS();

   private running = false;
   private handle: number;

   public start() {
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
            fd.append('file', blob, 'myBlob');

            // TODO limit to one call at a time
            let sw = new Stopwatch();
            fetch(this.url,
               {
                  method: 'post',
                  body: fd
               })
               .then((response) => {
                  this.uploadTime = sw.elapsedMs;
                  URL.revokeObjectURL(url);

                  if (response.status != 200) {
                     return Promise.reject(response.status + ': ' + response.statusText);
                  }
               })
               .catch((reason) => {
                  console.log('Upload failure for [' + this.url + '] ' + reason);
               })
               .finally(() => {
                  if (this.running) {
                     this.handle = requestAnimationFrame(() => this.upload());
                  }
               });
         })
   }
}