import { Stopwatch } from "./Stopwatch";
import { FPS } from "./FPS";

type DownloadHandler = (blob: Blob, downloadTime: number) => void;

export class Downloader {

   public url: string;
   public onDownload: DownloadHandler;
   public fps = new FPS();

   public start() {
      requestAnimationFrame(() => this.download());
   }

   private download() {

      this.fps.tick();

      let sw = new Stopwatch();
      fetch(this.url)
         .then(response => {
            if (response.status !== 200) {
               throw 'non 200 download error: ' + response.statusText;
            }
            return response.blob();
         })
         .then((blob) => {

            if (this.onDownload) {
               this.onDownload(blob, sw.elapsedMs);
            }
         })
         .catch((reason) => {
            console.log('download failure: ' + reason);
         })
         .finally(() => {
            requestAnimationFrame(() => this.download());
         });
   }
}