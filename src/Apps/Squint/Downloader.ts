import { FPS } from "../../Util/FPS";
import { Squint, SquintError } from "./Squint";
import { Stopwatch } from "../../Util/Stopwatch";
import { toSizeStr, toTimeStr } from "../../Util/Globals";

type DownloadHandler = (blob: Blob, downloadTime: number) => void;

export class Downloader {

   private onDownload: DownloadHandler;
   public fps = new FPS();
   public running = true;
   private squint: Squint;
   private id: string;
   private busy = false;

   public onStop: () => void;

   public constructor(squint: Squint, id: string, onDownload: DownloadHandler) {
      console.log('starting downloader: ' + id);
      this.squint = squint;
      this.id = id;
      this.onDownload = onDownload;
      this.download();
   }

   public stop() {
      if (this.running) {
         console.log('stopping downloader');
         this.running = false;
      }
   }

   private download(delay = 0) {

      if (!this.running) {
         return;
      }
      if (this.busy) {
         console.error('download() called before previous call returned');
      }
      if (delay > 0) {
         setTimeout(() => {
            this.download(0);
         }, delay);
         return;
      }

      this.busy = true;
      this.fps.tick();

      let nextDelay = 0;
      let sw = new Stopwatch();
      console.log('starting download');
      this.squint.get(this.id)
         .then((blob) => {
            console.log('got download blob: ' + blob + ' ' + toSizeStr(blob.size) + ' ' + toTimeStr(sw.elapsedMs));
            if (this.running) {
               try {
                  this.onDownload(blob, sw.elapsedMs);
               }
               catch (err) {
                  console.error('Unexpected exception in Downloader.onDownload(): ' + err);
                  this.stop();
               }
            }
         })
         .catch((err) => {
            if (err.name === 'AbortError') {
               return;
            }
            else if (err instanceof SquintError) {
               if (err.status === 404) {
                  alert('The Squint host camera has ended.')
               }
               else {
                  console.log('download failed (stopping downloads): ' + err);
               }

               this.stop();
               if (this.onStop) {
                  this.onStop();
               }
            }
            else {
               console.log('download failed (trying again): ' + err);
               nextDelay = 3000;
            }
         })
         .finally(() => {
            this.busy = false;
            this.download(nextDelay);
         });
   }
}