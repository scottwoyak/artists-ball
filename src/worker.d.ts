declare module 'worker-loader?name=LoaderWorker.worker.js!*' {
   class LoaderWorker extends Worker {
      constructor();
   }

   export default LoaderWorker
}