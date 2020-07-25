// specify loader and options here. This value must match the
// the file where it is imported
declare module 'worker-loader?name=LoaderWorker.worker.js!*' {
   class LoaderWorker extends Worker {
      constructor();
   }

   export default LoaderWorker
}