

export interface ISession {
   name: string,
   sessionId: string,
}

export interface ISessions {
   responseId: string,
   sessions: ISession[],
}

export class Squint {

   //private host = 'https://woyaktest.ue.r.appspot.com/';
   //private host = 'http://192.168.86.23:8080/';
   //private host = 'http://localhost:8080/';
   //private host = 'http://' + location.hostname + ':8080/V1';
   //private host = 'http://' + location.hostname + ':3000/';

   static readonly url = 'https://squintserver-11278.nodechef.com/V1';
   //static readonly url = 'http://' + location.hostname + ':8080/V1'

   public get(id: string): Promise<Blob> {
      return fetch(Squint.url + '/sessions/' + id)
         .then(response => {
            if (response.status !== 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
            return response.blob();
         });
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
            body: fd
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
         })
         .then((response) => {
            if (response.status != 200) {
               return Promise.reject(response.status + ': ' + response.statusText);
            }
            else {
               return response.json()
            }
         });
   }
}