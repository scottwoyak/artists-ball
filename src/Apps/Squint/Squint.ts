import { SquintUrl as SquintUrl } from "./Servers";
import { debug } from "./SquintApp";
import { SquintConnector, ISquintConnection } from "./SquintConnector";

export interface ISquintMessage {
   [prop: string]: any,
   subject:
   'CreateSession' |
   'SessionCreated' |
   'SessionCreateError' |
   'SessionList' |
   'Subscribe' |
   'ReadyForNextImage' |
   'Reconnected' |
   'Hello',
}

export interface ISession {
   name: string,
   connectionId: string,
}

export type ImageHandler = (img: Blob) => void;
export type SessionListHandler = (session: ISession[]) => void;
export type ReconnectingHandler = () => void;
export type ReconnectedHandler = (success: boolean) => void;

type SessionCreatedHandler = (session: ISession) => void;
type SessionCreateErrorHandler = (error: string) => void;

const NORMAL_CLOSURE = 1000;

export class Squint {

   public static readonly url = SquintUrl;

   public ws: WebSocket;
   private _reconnecting = false;

   public onImage: ImageHandler;
   public onSessionList: SessionListHandler;
   private onSessionCreated: SessionCreatedHandler;
   private onSessionCreateError: SessionCreateErrorHandler;
   private connectionId: string;

   public onError: (event: Event) => void;
   public onClose: () => void;
   public onReconnecting: ReconnectingHandler;
   public onReconnected: ReconnectedHandler;

   public constructor() {
      window.addEventListener('unload', () => {
         if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.close();
         }
      });
      /*
      window.addEventListener('beforeunload', () => {
         console.log('beforeunload');
      });

      window.addEventListener('pagehide', () => {
         alert('pagehide');
         console.log('pagehide');
      });
      */
   }

   public get connected(): boolean {
      return (this.ws && this.ws.readyState === WebSocket.OPEN);
   }

   public get reconnecting(): boolean {
      return this._reconnecting;
   }

   public get bufferReady(): boolean {
      if (!this.connected) {
         debug('Squint.bufferReady() called after websocket was disconnected');
         return false;
      }

      return this.ws.bufferedAmount === 0;
   }

   private setWS(ws: WebSocket) {

      this.ws = ws;

      ws.onopen = null;

      ws.onclose = (event: CloseEvent) => {
         console.warn('xxx ws.onclose()');
         if (event.code === NORMAL_CLOSURE) {
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
            this.ws.onopen = null;
            this.ws = null;
            if (this.onClose) {
               this.onClose();
            }
         }
         else {
            this.tryToReconnect();
         }
      }

      ws.onerror = (event: Event) => {
         this.tryToReconnect();
      }

      ws.onmessage = (message: MessageEvent) => {
         if (ws.readyState !== WebSocket.OPEN) {
            debug('ws.onmessage() message received, but socket not open');
         }

         // process the image
         if (message.data instanceof Blob) {
            if (this.onImage) {
               this.onImage(message.data);
            }
         }
         else if (typeof message.data === 'string') {
            try {
               let obj = JSON.parse(message.data) as ISquintMessage;
               this.processMessage(obj);
            }
            catch (err) {
               console.log('Invalid message not received: Invalid JSON.\n' + message.data);
            }
         }
      };
   }

   private tryToReconnect() {
      this._reconnecting = true;
      if (this.onReconnecting) {
         this.onReconnecting();
      }
      this.reconnect(SquintUrl, this.connectionId)
         .then(() => {
            this._reconnecting = false;
            if (this.onReconnected) {
               this.onReconnected(true);
            }
         })
         .catch((err) => {
            this._reconnecting = false;
            this.ws = null;
            if (this.onReconnected) {
               this.onReconnected(false);
            }
            if (this.onClose) {
               this.onClose();
            }
         });
   }

   public reconnect(url: string, reconnectId: string): Promise<void> {
      return this.doConnect(url, reconnectId);
   }

   public connect(url: string): Promise<void> {
      return this.doConnect(url);
   }

   private doConnect(url: string, reconnectId: string = undefined): Promise<void> {

      if (this.connected) {
         return Promise.reject('Cannot connect to server: previous connection is still open');
      }

      return SquintConnector.connect(url, reconnectId)
         .then((connection: ISquintConnection) => {
            this.connectionId = connection.id;
            this.setWS(connection.ws);
         });
   }

   public close() {
      if (!this.connected) {
         debug('Squint.close() called but no connection exists');
         return;
      }

      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;

      this.ws.close(NORMAL_CLOSURE);
      this.ws = null;
   }

   private processMessage(msg: ISquintMessage) {
      switch (msg.subject) {
         case 'SessionCreated':
            if (this.onSessionCreated) {
               this.onSessionCreated({
                  name: msg.name,
                  connectionId: msg.connectionId,
               });
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
         debug('Squint.send() called, but not connected');
         return;
      }

      this.ws.send(JSON.stringify(msg));
   }

   public sendImage(blob: Blob) {
      if (!this.connected) {
         debug('Squint.sendImage() called, but not connected');
         return;
      }

      if (this.bufferReady) {
         this.ws.send(blob);
      }
      else {
         console.log('skipping upload, buffer not empty: ' + this.ws.bufferedAmount);
      }
   }

   public requestNextImage() {
      this.send({
         subject: 'ReadyForNextImage',
      });
   }

   public createSession(name: string): Promise<ISession> {
      return new Promise((resolve, reject) => {
         if (!this.connected) {
            console.log('createSession() socket ready state: ' + (this.ws ? this.ws.readyState : 'null'));
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

   public subscribe(connectionId: string) {
      if (!this.connected) {
         throw new Error('Cannot subscribe. WebSocket not connected.');
      }

      this.send({
         subject: 'Subscribe',
         connectionId: connectionId,
      })
   }
}