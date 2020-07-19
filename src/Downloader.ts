import { Stopwatch } from "./Stopwatch";
import { FPS } from "./FPS";
import { Squint } from "./Squint";

type DownloadHandler = (blob: Blob, downloadTime: number) => void;

export class Downloader {

   public onDownload: DownloadHandler;
   public fps = new FPS();
   private handle: number;
   public running = false;
   private squint = new Squint();
   private id: string;

   public start(id: string) {
      this.id = id;
      this.running = true;
      this.handle = requestAnimationFrame(() => this.download());
   }

   public stop() {
      this.running = false;
      cancelAnimationFrame(this.handle);
   }

   private download() {

      this.fps.tick();

      let sw = new Stopwatch();
      this.squint.get(this.id)
         .then((blob) => {

            if (this.onDownload) {
               this.onDownload(blob, sw.elapsedMs);
            }
         })
         .catch((reason) => {
            console.log('Download failure for [' + Squint.url + '] ' + reason);
         })
         .finally(() => {
            if (this.running) {
               requestAnimationFrame(() => this.download());
            }
         });
   }
}