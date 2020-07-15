import { Stopwatch } from "./Stopwatch";
import { FPS } from "./FPS";

type DownloadHandler = (blob: Blob, downloadTime: number) => void;

export class Downloader {

   public url: string;
   public onDownload: DownloadHandler;
   public fps = new FPS();
   private handle: number;
   public running = false;

   public start() {
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
      fetch(this.url)
         .then(response => {
            if (response.status !== 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
            return response.blob();
         })
         .then((blob) => {

            if (this.onDownload) {
               this.onDownload(blob, sw.elapsedMs);
            }
         })
         .catch((reason) => {
            console.log('Download failure for [' + this.url + '] ' + reason);
         })
         .finally(() => {
            if (this.running) {
               requestAnimationFrame(() => this.download());
            }
         });
   }
}