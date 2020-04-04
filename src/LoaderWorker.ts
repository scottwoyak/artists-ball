import { TriangleObjFile } from "./TriangleObjFile";
import { TriangleObj, TriangleObjData } from "./TriangleObj";
import { Profiler } from "./Profiler";

/**
 * This is the worker that loads and processes the .obj file
 */
const worker: Worker = self as any;

// Handler for receiving messages from the main thread
worker.onmessage = ({ data }: { data: string }) => {

   // when we receive a string as a message, it's the url of the file to load
   loadFile(data);
}

/**
 * The worker function to load a file
 * 
 * @param file The url of the file to load
 */
async function loadFile(file: string) {

   // the initial status message
   worker.postMessage('Downloading 0%');

   try {
      let chunksAll = await fetchData(file);
      let data: TriangleObjData;

      if (file.toLowerCase().endsWith('.obj')) {
         // decode into a string
         let res = new TextDecoder("utf-8").decode(chunksAll);

         // turn the .obj string into triangles
         let tObj = new TriangleObjFile(file, res, (status) => { worker.postMessage(status); });
         data = tObj.toData();
      }
      else if (file.toLowerCase().endsWith('.blob')) {
         let blob = new Blob([chunksAll]);
         data = await TriangleObj.blobToData(blob);
      }

      // return the result as arrays
      worker.postMessage(data, [
         data.vertices.buffer,
         data.normals.buffer,
         data.indices.buffer,
      ]);
   }
   catch (err) {
      worker.postMessage(err);
   }
}

async function fetchData(file: string): Promise<Uint8Array> {

   let response = await fetch(file);

   if (response.status != 200) {
      worker.postMessage(response.status + ': ' + file);
      return;
   }

   const reader = response.body.getReader();
   const contentLength = +response.headers.get('Content-Length');

   // loop to load the data, one chunk at a time
   let receivedLength = 0; // received that many bytes at the moment
   let chunks = []; // array of received binary chunks (comprises the body)
   while (true) {
      const { done, value } = await reader.read();

      if (done) {
         break;
      }

      chunks.push(value);
      receivedLength += value.length;

      worker.postMessage('Downloading: ' + (100 * receivedLength / contentLength).toFixed() + '%');
   }

   // concatenate chunks into single Uint8Array
   let chunksAll = new Uint8Array(receivedLength); // (4.1)
   let position = 0;
   for (let chunk of chunks) {
      chunksAll.set(chunk, position); // (4.2)
      position += chunk.length;
   }

   return chunksAll;
}