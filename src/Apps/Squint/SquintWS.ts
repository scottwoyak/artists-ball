import { SquintWsUrl } from "./Servers";

export interface ISquintMessage {
   [prop: string]: any,
   subject: 'CreateSession' | 'SessionCreated' | 'SessionCreateError' | 'SessionList' | 'Subscribe' | 'Ready',
}
export interface ISession {
   name: string,
   id: string,
}

export type OnImageHandler = (img: Blob) => void;
export type SessionListHandler = (session: ISession[]) => void;

type SessionCreatedHandler = (session: ISession) => void;
type SessionCreateErrorHandler = (error: string) => void;

export class SquintWS {

   public static readonly url = SquintWsUrl;

   private ws: WebSocket;

   public onImage: OnImageHandler;
   public onSessionList: SessionListHandler;
   private onSessionCreated: SessionCreatedHandler;
   private onSessionCreateError: SessionCreateErrorHandler;

   public onError: (event: Event) => void;
   public onClose: (event: CloseEvent) => void;

   public get bufferReady(): boolean {
      return this.ws.bufferedAmount === 0;
   }

   private setWS(ws: WebSocket) {
      this.ws = ws;

      ws.onopen = null;

      ws.onerror = (event: Event) => {
         if (this.onError) {
            this.onError(event);
         }
      };

      ws.onmessage = (message: MessageEvent) => {
         if (message.data instanceof Blob) {
            if (this.onImage) {
               this.onImage(message.data);
            }

            this.send({
               subject: 'Ready',
            });
         }
         else if (typeof message.data === 'string') {
            try {
               let obj = JSON.parse(message.data);
               this.processMessage(obj);
            }
            catch (err) {
               console.log('Invalid message not received: Invalid JSON.\n' + message.data);
            }
         }
      };

      ws.onclose = (event: CloseEvent) => {
         if (this.onClose) {
            this.onClose(event);
         }
      }
   }

   public connect(url: string): Promise<void> {
      return new Promise((resolve, reject) => {

         // TODO prevent calls if already connected or trying to connect

         // create temporary handlers that process the server handshake
         let ws = new WebSocket(url);
         ws.onclose = (event) => {
            reject('Could not connect to server: ' + event.code);
         }

         ws.onopen = () => {
            ws.send('Hello');
         };

         ws.onerror = (err) => {
            reject(err);
         };

         ws.onmessage = (messageEvent) => {
            try {
               let msg = JSON.parse(messageEvent.data);
               if (msg.subject && msg.subject === 'Hello') {
                  this.setWS(ws);
                  resolve();
               }
               else {
                  reject('Invalid Server Version');
               }
            }
            catch (err) {
               reject(err);
            }
         }
      });
   }

   public close() {
      this.ws.close();
   }

   private processMessage(msg: ISquintMessage) {
      switch (msg.subject) {
         case 'SessionCreated':
            if (this.onSessionCreated) {
               this.onSessionCreated({ id: msg.sessionId, name: msg.name });
            };
            break;

         case 'SessionCreateError':
            if (this.onSessionCreateError) {
               this.onSessionCreateError(msg.error);
            };
            break;

         case 'SessionList':
            if (this.onSessionList) {
               this.onSessionList(msg.sessions);
            }
            break;

         case undefined:
            console.error('Invalid Message: \'subject\' not found.\n' + JSON.stringify(msg, null, ' '));
            break;
      }
   }

   private send(msg: ISquintMessage) {
      this.ws.send(JSON.stringify(msg));
   }

   public sendImage(blob: Blob) {
      if (this.bufferReady) {
         this.ws.send(blob);
      }
      else {
         console.log('skipping upload, buffer not empty');
      }
   }

   public createSession(name: string): Promise<ISession> {
      this.send({
         subject: 'CreateSession',
         name: name,
      });

      return new Promise((resolve, reject) => {
         this.onSessionCreated = (session) => {
            this.onSessionCreated = null;
            this.onSessionCreateError = null;
            resolve(session);
         };
         this.onSessionCreateError = (err) => {
            this.onSessionCreated = null;
            this.onSessionCreateError = null;
            reject(err);
         };

         // TODO if the socket closes we should also reject
      });
   }

   public subscribe(sessionId: string) {
      this.send({
         subject: 'Subscribe',
         sessionId: sessionId,
      })
   }
}