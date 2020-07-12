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
               console.log('XXX blob is null');
               return; // TODO when does this happen?
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
                     throw 'non 200 uploadload error: ' + response.statusText;
                  }
               })
               .catch((err) => {
                  console.log(err);
               })
               .finally(() => {
                  if (this.running) {
                     this.handle = requestAnimationFrame(() => this.upload());
                  }
               });
         })
   }
}