// specify loader and options here. This value must match the
// contents of worker.d.ts
import LoaderWorker from 'worker-loader?name=LoaderWorker.worker.js!./LoaderWorker';

import { TriangleObj } from './TriangleObj';
import { StatusFunction, toRad } from './Globals';
import { glObject } from './glObject';

/**
 * Class for doing the work of loading a file into a glObject
 */
export class ModelLoader {

   /**
    * The WebWorker that does the download and processing
    */
   private worker: LoaderWorker;

   /**
    * Loads a file
    * 
    * @param file The file url to load
    * @param updateStatus Callback that is notified of progress
    * @returns TriangleObj promise
    */
   public loadModelFile(file: string, updateStatus: StatusFunction): Promise<TriangleObj> {

      return new Promise<TriangleObj>((resolve, reject) => {

         // if a previous worker exists, close it
         if (this.worker) {
            this.worker.terminate();
            this.worker = undefined;
         }

         this.worker = new LoaderWorker();
         let tStart = Date.now();
         this.worker.onmessage = ({ data }: { data: any }) => {

            if (typeof data === 'string') {
               // avoid flashing messages for things that happen very quickly.
               if (Date.now() - tStart > 500) {
                  updateStatus(data);
               }
            }
            else {
               let tObj = TriangleObj.fromData(data);

               updateStatus('');

               this.worker.terminate();
               this.worker = undefined;

               resolve(tObj);
            }
         };

         this.worker.postMessage(file);
      });
   }

   public orient(model: glObject) {

      // orient each file so that it is facing forward
      let name = model.name.split('.')[0].toLowerCase();
      switch (name) {
         case 'skull1':
            model.rotX(toRad(90));
            //model.rotY(toRad(180));
            break;

         case 'pelvis':
            model.rotX(toRad(11));
            model.rotZ(toRad(-87));
            model.rotY(toRad(180));
            break;

         case 'wolf':
            model.rotY(toRad(-140));
            model.rotX(toRad(5));
            model.rotY(toRad(180));
            break;

         case 'skull4':
            model.rotX(toRad(80));
            model.rotY(toRad(-22));
            model.rotZ(toRad(-1));
            break;

         case 'sheephead':
            model.rotY(toRad(20));
            break;

         case 'pose1':
            model.rotY(toRad(180));
            break;

         case 'teapot':
            model.rotY(toRad(90));
            break;

         default:
            break;
      }
   }
}