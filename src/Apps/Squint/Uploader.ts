import { FPS } from "../../Util/FPS";
import { Squint } from "./Squint";
import { debug } from "./SquintApp";
import { Stopwatch } from "../../Util/Stopwatch";
import { toSizeStr, toTimeStr } from "../../Util/Globals";

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
         console.log('starting uploader');
         this.id = id;
         this.handle = requestAnimationFrame(() => this.upload());
         this.running = true;
      }
   }

   public stop() {
      if (this.running) {
         console.log('stopping uploader');
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
            console.log('uploading: size=' + toSizeStr(blob.size));
            this.squint.put(this.id, fd)
               .then(() => {
                  console.log('uploaded: ' + toTimeStr(sw.elapsedMs));
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