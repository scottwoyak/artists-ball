import { SquintUrl as SquintUrl } from "./Servers";

export interface ISquintMessage {
   [prop: string]: any,
   subject: 'CreateSession' | 'SessionCreated' | 'SessionCreateError' | 'SessionList' | 'Subscribe' | 'ReadyForNextImage',
}
export interface ISession {
   name: string,
   id: string,
}

export type OnImageHandler = (img: Blob) => void;
export type SessionListHandler = (session: ISession[]) => void;

type SessionCreatedHandler = (session: ISession) => void;
type SessionCreateErrorHandler = (error: string) => void;

export class Squint {

   public static readonly url = SquintUrl;

   private ws: WebSocket;

   public onImage: OnImageHandler;
   public onSessionList: SessionListHandler;
   private onSessionCreated: SessionCreatedHandler;
   private onSessionCreateError: SessionCreateErrorHandler;

   public onError: (event: Event) => void;
   public onClose: (event: CloseEvent) => void;

   public constructor() {
      window.addEventListener('beforeunload', () => {
         if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
         }
      });
   }

   public get connected(): boolean {
      return (this.ws && this.ws.readyState === WebSocket.OPEN);
   }

   public get bufferReady(): boolean {
      if (!this.connected) {
         throw new Error('WebSocket not connected.');
      }

      return this.ws.bufferedAmount === 0;
   }

   private setWS(ws: WebSocket) {

      this.ws = ws;

      ws.onopen = null;

      ws.onerror = (event: Event) => {
         this.ws = null;
         if (this.onError) {
            this.onError(event);
         }
      };

      ws.onmessage = (message: MessageEvent) => {
         // process the image
         if (message.data instanceof Blob) {
            if (this.onImage) {
               this.onImage(message.data);
            }

            // let the server know we're ready for the next download
            this.send({
               subject: 'ReadyForNextImage',
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
         this.ws = null;
         if (this.onClose) {
            this.onClose(event);
         }
      }
   }

   public connect(url: string): Promise<void> {

      return new Promise((resolve, reject) => {

         if (this.connected) {
            reject('Cannot connect to server: previous connection is still open');
            return;
         }

         // create temporary handlers that process the server handshake
         let ws = new WebSocket(url);
         ws.onclose = (event) => {
            reject('Cannot connect to server: ' + event.code);
         }

         ws.onopen = () => {
            // send handshake message
            ws.send('Hello');
         };

         ws.onerror = (event: Event) => {
            reject('Cannot connect to ' + url);
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
      if (!this.connected) {
         throw new Error('WebSocket not connected.');
      }

      this.ws.close();
      this.ws = null;
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

         default:
            console.error('Invalid Message: unknown \'subject\'.\n' + JSON.stringify(msg, null, ' '));
            break;

      }
   }

   private send(msg: ISquintMessage) {
      if (!this.connected) {
         throw new Error('WebSocket not connected.');
      }

      this.ws.send(JSON.stringify(msg));
   }

   public sendImage(blob: Blob) {
      if (!this.connected) {
         throw new Error('WebSocket not connected.');
      }

      if (this.bufferReady) {
         this.ws.send(blob);
      }
      else {
         console.log('skipping upload, buffer not empty');
      }
   }

   public createSession(name: string): Promise<ISession> {
      return new Promise((resolve, reject) => {
         if (!this.connected) {
            console.log('socket ready state: ' + this.ws.readyState);
            reject('WebSocket not connected.');
         }
         this.send({
            subject: 'CreateSession',
            name: name,
         });

         let closeHandler = () => {
            reject('WebSocket was closed');
         }
         this.ws.addEventListener('close', closeHandler);
         let errHandler = () => {
            reject('WebSocket error');
         }
         this.ws.addEventListener('error', errHandler);

         this.onSessionCreated = (session) => {
            this.onSessionCreated = null;
            this.onSessionCreateError = null;
            this.ws.removeEventListener('close', closeHandler);
            this.ws.removeEventListener('error', errHandler);
            resolve(session);
         };
         this.onSessionCreateError = (err) => {
            this.onSessionCreated = null;
            this.onSessionCreateError = null;
            this.ws.removeEventListener('close', closeHandler);
            this.ws.removeEventListener('error', errHandler);
            reject(err);
         };
      });
   }

   public subscribe(sessionId: string) {
      if (!this.connected) {
         throw new Error('WebSocket not connected.');
      }

      this.send({
         subject: 'Subscribe',
         sessionId: sessionId,
      })
   }
}