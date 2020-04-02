import './BlobShim';

/**
 * Internal class for slicing up Blobs
 */
class BlobSlicer {

   // The start byte value for the next slice
   private start = 0;

   // The Blob we're slicing 
   private blob: Blob;

   /**
    * @param blob The Blob to be sliced
    */
   public constructor(blob: Blob) {
      this.blob = blob;
   }

   /**
    * Gets the next slice.
    * 
    * @param len The length of the slice.
    * @returns The sliced Blob.
    */
   public next(len: number): Blob {
      let b = this.blob.slice(this.start, this.start + len);
      this.start += len;
      return b;
   }

   /**
    * Slices the Blob and returns it as an ArrayBuffer.
    * 
    * @param len The length of the slice.
    * @returns An ArrayBuffer promise.
    */
   public nextArrayBuffer(len: number): Promise<ArrayBuffer> {
      return this.next(len).arrayBuffer();
   }

   /**
    * Slices the Blob and returns it as an Int32Array
    *
    * @param len The length of the slice.
    * @returns An Int32Array promise.
    */
   public async nextInt32Array(len: number): Promise<Int32Array> {
      return new Int32Array(await this.nextArrayBuffer(len));
   }

   /**
    * Slices the Blob and returns it as a string
    *
    * @param len The length of the slice.
    * @returns A string promise.
    */
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

   /**
    * @param info The information header to be stored with the Blob
    * @param parts The data contents of the Blob
    */
   private constructor(info: object, parts: Blob[]) {
      this.info = info;
      this.parts = parts;
   }

   /**
    * Converts a raw Blob object into a BlobFile
    * 
    * @param blob The Blob to process.
    * @return A BlobFile promise.
    */
   public static async extract(blob: Blob): Promise<BlobFile> {

      let blobSlicer = new BlobSlicer(blob);

      // first extract the number of entries
      let numEntries = (await blobSlicer.nextInt32Array(4))[0];

      // the the sizes array
      let sizes = await blobSlicer.nextInt32Array(4 * (numEntries + 1));

      // then the info object
      let jsonInfo = await blobSlicer.nextString(sizes[0]);

      // then all the sub blobs
      let parts: Blob[] = [];
      for (let i = 0; i < numEntries; i++) {
         let size = sizes[i + 1];
         parts.push(blobSlicer.next(size));
      }

      return new BlobFile(JSON.parse(jsonInfo), parts);
   }

   /**
    * Create a BlobFile Blob
    * 
    * @param info The information header to be stored with the Blob
    * @param parts The data contents of the Blob
    */
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