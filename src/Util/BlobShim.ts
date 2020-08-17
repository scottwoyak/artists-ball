// needed for Safari
if (!Blob.prototype.arrayBuffer) {
   Blob.prototype.arrayBuffer = function (): Promise<ArrayBuffer> {

      // read the Blob the old fashioned way
      return new Promise<ArrayBuffer>((resolve, reject) => {

         const reader = new FileReader();

         // register event handlers
         reader.onloadend = () => {
            resolve(reader.result as ArrayBuffer);
         }

         reader.onerror = () => {
            reject(reader.error);
         }

         // start the read
         reader.readAsArrayBuffer(this);
      });
   }
}

// needed for Safari
if (!Blob.prototype.text) {

   // read the Blob the old fashioned way
   Blob.prototype.text = function (): Promise<string> {

      // read the Blob the old fashioned way
      return new Promise<string>((resolve, reject) => {

         const reader = new FileReader();

         // register event handlers
         reader.onloadend = () => {
            // decode into a string
            const txt = new TextDecoder('utf-8').decode(reader.result as ArrayBuffer);
            resolve(txt);
         }

         reader.onerror = () => {
            reject(reader.error);
         }

         // start the read
         reader.readAsArrayBuffer(this);
      });
   }
}
