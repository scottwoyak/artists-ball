

export class Squint {

   //private host = 'https://squintserver-11278.nodechef.com/';
   //private host = 'https://woyaktest.ue.r.appspot.com/';
   //private host = 'http://192.168.86.23:8080/';
   //private host = 'http://localhost:8080/';
   //private host = 'http://' + location.hostname + ':8080/V1';
   //private host = 'http://' + location.hostname + ':3000/';

   static readonly url = 'http://' + location.hostname + ':8080/V1'

   public get(): Promise<Blob> {
      return fetch(Squint.url)
         .then(response => {
            if (response.status !== 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
            return response.blob();
         });
   }

   public post(fd: FormData): Promise<void> {
      return fetch(Squint.url,
         {
            method: 'post',
            body: fd
         })
         .then((response) => {
            if (response.status != 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
         });
   }
}