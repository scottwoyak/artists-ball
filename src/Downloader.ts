import { Stopwatch } from "./Stopwatch";
import { FPS } from "./FPS";
import { Squint, SquintError } from "./Squint";

type DownloadHandler = (blob: Blob, downloadTime: number) => void;

export class Downloader {

   public onDownload: DownloadHandler;
   public fps = new FPS();
   private handle: number;
   public running = false;
   private squint: Squint;
   private id: string;

   public onStop: () => void;

   public constructor(squint: Squint) {
      this.squint = squint;
   }

   public start(id: string) {
      if (!this.running) {
         //debug('starting downloader: ' + id);
         this.id = id;
         this.running = true;
         this.handle = requestAnimationFrame(() => this.download());
      }
   }

   public stop() {
      if (this.running) {
         //debug('stopping downloader');
         this.running = false;
         cancelAnimationFrame(this.handle);
      }
   }

   private download() {

      this.fps.tick();

      let sw = new Stopwatch();
      this.squint.get(this.id)
         .then((blob) => {
            //console.log('download time: ' + sw.elapsedMs);
            if (this.running && this.onDownload) {
               this.onDownload(blob, sw.elapsedMs);
            }
         })
         .catch((reason) => {
            if (reason.name === 'AbortError') {
               return;
            }
            else if (reason instanceof SquintError) {
               if (reason.status === 404) {
                  alert('The Squint host camera has ended.')
                  this.stop();
                  if (this.onStop) {
                     this.onStop();
                  }
               }
               else {
                  // TODO fix error message to match the full url
                  alert('Download failure for [' + Squint.url + '] ' + reason);
               }
            }
            else {
               // TODO fix error message to match the full url
               alert('Download failure for [' + Squint.url + '] ' + reason);
            }
         })
         .finally(() => {
            if (this.running) {
               requestAnimationFrame(() => this.download());
            }
         });
   }
}