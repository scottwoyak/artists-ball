import { Stopwatch } from "./Stopwatch";
import { FPS } from "./FPS";
import { Squint } from "./Squint";
import { debug } from "./SquintApp";

export type DataNeededHandler = () => Promise<Blob>;

export class Uploader {
   public onDataNeeded: DataNeededHandler;
   public uploadTime: number;
   public fps = new FPS();

   private running = false;
   private handle: number;
   private squint: Squint;
   private id: string;

   public constructor(squint: Squint) {
      this.squint = squint;
   }

   public start(id: string) {
      if (!this.running) {
         //debug('starting uploader');
         this.id = id;
         this.handle = requestAnimationFrame(() => this.upload());
         this.running = true;
      }
   }

   public stop() {
      if (this.running) {
         //debug('stopping uploader');
         cancelAnimationFrame(this.handle);
         this.running = false;
      }
   }

   private upload() {
      if (!this.onDataNeeded) {
         return;
      }

      this.fps.tick();
      this.onDataNeeded()
         .then((blob: Blob) => {
            if (blob === null) {
               debug('Cannot generate image from video: blob is null');

               if (this.running) {
                  this.handle = requestAnimationFrame(() => this.upload());
               }

               return;
            }

            //console.log('upload size: ' + blob.size / (1024 * 1024));
            let url = URL.createObjectURL(blob);
            let fd = new FormData();
            fd.append('image', blob);

            let sw = new Stopwatch();
            this.squint.put(this.id, fd)
               .then(() => {
                  //console.log('upload time: ' + sw.elapsedMs);
                  this.uploadTime = sw.elapsedMs;
               })
               .catch((reason) => {
                  // TODO fix error message to match the full url
                  if (reason.name != 'AbortError') {
                     alert('Upload failure for [' + Squint.url + '] ' + reason);
                  }
               })
               .finally(() => {
                  URL.revokeObjectURL(url);
                  if (this.running) {
                     this.handle = requestAnimationFrame(() => this.upload());
                  }
               });
         }).catch((err) => {
            debug('Cannot generate image from video: ' + err);
         });
   }
}