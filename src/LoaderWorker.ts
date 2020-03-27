import { TriangleObjFile } from "./TriangleObjFile";
import { TriangleObjData } from "./TriangleObj";

const worker: Worker = self as any;

//worker.addEventListener("message", ({ data }: { data: string }) => console.log(JSON.stringify(data)));

worker.onmessage = ({ data }: { data: string }) => {
   loadFile(data);
}

async function loadFile(file: string) {
   worker.postMessage('Downloading 0%');

   // Step 1: start the fetch and obtain a reader
   let response = await fetch(file);

   const reader = response.body.getReader();

   // Step 2: get total length
   const contentLength = +response.headers.get('Content-Length');

   // Step 3: read the data
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

   // Step 4: concatenate chunks into single Uint8Array
   let chunksAll = new Uint8Array(receivedLength); // (4.1)
   let position = 0;
   for (let chunk of chunks) {
      chunksAll.set(chunk, position); // (4.2)
      position += chunk.length;
   }

   // Step 5: decode into a string
   let res = new TextDecoder("utf-8").decode(chunksAll);

   let tObj = new TriangleObjFile(res, (status) => { worker.postMessage(status); });

   let data = tObj.export();
   worker.postMessage(data, [
      data.vertices.buffer,
      data.normals.buffer,
      data.vIndices.buffer,
      data.nIndices.buffer
   ]);
}



