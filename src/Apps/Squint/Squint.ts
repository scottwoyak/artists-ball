

export interface ISession {
   name: string,
   id: string,
}

export interface ISessions {
   responseId: string,
   sessions: ISession[],
}

export class SquintError {
   public readonly status: number;
   public readonly statusText: string;

   public constructor(response: Response) {
      this.status = response.status;
      this.statusText = response.statusText;
   }

   public toString() {
      return this.status + ': ' + this.statusText;
   }
}

export class Squint {

   //private host = 'https://woyaktest.ue.r.appspot.com/';
   //private host = 'http://192.168.86.23:8080/';
   //private host = 'http://localhost:8080/';
   //private host = 'http://' + location.hostname + ':8080/V1';
   //private host = 'http://' + location.hostname + ':3000/';

   static readonly url = 'https://squintserver-11278.nodechef.com/V1';
   //static readonly url = 'http://' + location.hostname + ':8080/V1'

   private abortController = new AbortController();

   public constructor() {
      window.addEventListener('beforeunload', () => {
         this.abortController.abort();
      });
   }

   public get(id: string): Promise<Blob> {

      return fetch(Squint.url + '/sessions/' + id,
         {
            signal: this.abortController.signal
         })
         .then(response => {
            if (response.status !== 200) {
               return Promise.reject(new SquintError(response));
            }
            return response.blob();
         })
   }

   public createSession(name: string): Promise<string> {

      let json = {
         name: name,
      }

      return fetch(Squint.url + '/sessions',
         {
            method: 'post',
            headers: {
               "Content-Type": "application/json"
            },
            body: JSON.stringify(json),
            signal: this.abortController.signal,
         })
         .then((response) => {
            if (response.status != 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
            else {
               return response.json()
                  .then((obj) => {
                     if (obj.sessionId === undefined) {
                        throw 'Session ID not returned from server';
                     }
                     return obj.sessionId;
                  });
            }
         });
   }

   public put(id: string, fd: FormData): Promise<void> {
      return fetch(Squint.url + '/sessions/' + id,
         {
            method: 'post',
            body: fd,
            signal: this.abortController.signal,
         })
         .then((response) => {
            if (response.status != 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
         });
   }

   public listSessions(responseId?: string): Promise<ISessions> {

      let url = Squint.url + '/sessions';
      if (responseId) {
         url += '/?responseId=' + responseId;
      }

      return fetch(url,
         {
            method: 'get',
            signal: this.abortController.signal,
         })
         .then((response) => {
            if (response.status != 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
            else {
               return response.json();
            }
         });
   }
}