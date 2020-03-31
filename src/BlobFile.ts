class BlobBreaker {
   private start = 0;
   private blob: Blob;

   public constructor(blob: Blob) {
      this.blob = blob;
   }

   public next(len: number): Blob {
      // oh, Apple
      if ((<any>this.blob).webkitSlice) {
         let b = (<any>this.blob).webkitSlice(this.start, this.start + len);
         this.start += len;
         return b;
      }
      else {
         let b = this.blob.slice(this.start, this.start + len);
         this.start += len;
         return b;
      }
   }

   public async nextArrayBuffer(len: number): Promise<ArrayBuffer> {
      // oh, Apple, everyone else implements Blob.arrayBuffer()
      // return this.next(len).arrayBuffer();

      // read the Blob the old fashioned way
      return new Promise<ArrayBuffer>((resolve, reject) => {

         let reader = new FileReader();

         // register event handlers
         reader.onloadend = () => {
            resolve(reader.result as ArrayBuffer);
         }

         reader.onerror = () => {
            reject(reader.error);
         }

         // start the read
         let blob = this.next(len);
         reader.readAsArrayBuffer(blob);
      });
   }

   public async nextInt32Array(len: number): Promise<Int32Array> {
      return new Int32Array(await this.nextArrayBuffer(len));
   }

   public async nextString(len: number): Promise<string> {
      return this.next(len).text();
   }

}

/**
 * Manages creation and extraction of a self describing Blob. Data
 * is stored as:
 * 
 * [numEntries] - The number entries in the file. 4 byte Int32
 * [sizes] - Sizes of all the entries, including the info object
 * [info] - User supplied data as a JSON string
 * [entry 1] - First user entry
 * [entry 2] - Second user entry
 * [...]
 */
export class BlobFile {
   public info: any;
   public parts: Blob[] = [];

   private constructor(info: object, parts: Blob[]) {
      this.info = info;
      this.parts = parts;
   }

   public static async extract(blob: Blob): Promise<BlobFile> {

      let bb = new BlobBreaker(blob);

      // first extract the number of entries
      let numEntries = (await bb.nextInt32Array(4))[0];

      // the the sizes array
      let sizes = await bb.nextInt32Array(4 * (numEntries + 1));

      // then the info object
      let jsonInfo = await bb.nextString(sizes[0]);

      // then all the sub blobs
      let parts: Blob[] = [];
      for (let i = 0; i < numEntries; i++) {
         let size = sizes[i + 1];
         parts.push(bb.next(size));
      }

      return new BlobFile(JSON.parse(jsonInfo), parts);
   }

   public static createBlob(info: object, parts: BlobPart[]): Blob {

      let jsonInfo = JSON.stringify(info);

      // Build the array of sizes
      let sizes: number[] = [jsonInfo.length];
      for (let i = 0; i < parts.length; i++) {
         let part = parts[i];
         if (part instanceof Int32Array) {
            sizes.push(4 * part.length);
         }
         else if (part instanceof Float32Array) {
            sizes.push(4 * part.length);
         }
         else if (part instanceof String) {
            sizes.push(part.length);
         }
         else {
            let msg = 'Unsupported Blob Part Type: ' + typeof part;
            console.error(msg);
            throw new Error(msg);
         }
      }

      // assemble the blob parts
      let allParts: BlobPart[] = [];
      allParts.push(new Int32Array([parts.length]));
      allParts.push(new Int32Array(sizes));
      allParts.push(jsonInfo);
      allParts.push(...parts);

      // create the blob
      return new Blob(allParts);
   }
}