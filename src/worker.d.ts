declare module 'worker-loader!*' {
   class LoaderWorker extends Worker {
      constructor();
   }

   export default LoaderWorker
}