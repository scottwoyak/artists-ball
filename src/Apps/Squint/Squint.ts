import { SquintWsUrl as SquintWsUrl } from "./Servers";
import { debug } from "./SquintApp";
import { SquintSocket } from "./SquintSocket";
import { ISquintMessage, IConnectionInfo } from "./SquintMessage";

export type ImageHandler = (img: Blob) => void;
export type SessionListHandler = (session: IConnectionInfo[]) => void;
export type ViewerListHandler = (session: IConnectionInfo[]) => void;
export type ChatMessageHandler = (source: IConnectionInfo, msg: string) => void;
export type ReconnectingHandler = () => void;
export type ReconnectedHandler = (success: boolean) => void;

type UpdateConnectionInfoHandler = (info: IConnectionInfo) => void;

export class Squint {

   public static readonly url = SquintWsUrl;

   public ss: SquintSocket;
   public userName: string;
   private _reconnecting = false;

   public onImage: ImageHandler;
   public onSessionList: SessionListHandler;
   public onViewerList: ViewerListHandler;
   public onChatMessage: ChatMessageHandler;

   public onError: (event: Event) => void;
   public onClose: () => void;
   public onReconnecting: ReconnectingHandler;
   public onReconnected: ReconnectedHandler;
   public onUpdateConnectionInfo: UpdateConnectionInfoHandler;

   public get connectionInfo(): IConnectionInfo {
      return {
         connectionId: this.ss.connectionId,
         userName: this.userName
      }
   }

   public constructor() {
      window.addEventListener('unload', () => {
         if (this.ss && this.ss.connected) {
            this.ss.close();
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
      if (this.ss && this.ss.connected) {
         return true;
      }
      else {
         return false;
      }
   }

   public get reconnecting(): boolean {
      return this._reconnecting;
   }

   public get bufferReady(): boolean {
      if (!this.connected) {
         debug('Squint.bufferReady() called after websocket was disconnected');
         return false;
      }

      return this.ss.bufferedAmount === 0;
   }

   private setSS(ss: SquintSocket) {

      this.ss = ss;

      ss.onClose = (code: number) => {
         let connectionId = ss.connectionId;
         this.ss = null;
         if (code === SquintSocket.NORMAL_CLOSURE) {
            if (this.onClose) {
               this.onClose();
            }
         }
         else {
            console.log('warn: websocket closed with code: ' + code);
            this.tryToReconnect(connectionId);
         }
      }

      ss.onImage = (blob: Blob) => {
         if (!ss.connected) {
            debug('ss.onImage() message received, but socket not open');
         }

         if (this.onImage) {
            this.onImage(blob);
         }
      }

      ss.onMessage = (msg: ISquintMessage) => {
         if (!ss.connected) {
            debug('ws.onMessage() message received, but socket not open');
         }

         // process the image
         this.processMessage(msg);
      };
   }

   private tryToReconnect(connectionId: string) {
      this._reconnecting = true;
      if (this.onReconnecting) {
         this.onReconnecting();
      }
      this.reconnect(SquintWsUrl, connectionId)
         .then(() => {
            this._reconnecting = false;
            if (this.onReconnected) {
               this.onReconnected(true);
            }
         })
         .catch((err) => {
            this._reconnecting = false;
            this.ss = null;
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

   public connect(url: string, userName: string): Promise<void> {
      this.userName = userName;
      return this.doConnect(url);
   }

   private doConnect(url: string, reconnectId: string = undefined): Promise<void> {

      if (this.connected) {
         return Promise.reject('Cannot connect to server: previous connection is still open');
      }

      return SquintSocket.connect(url, this.userName, reconnectId)
         .then((ss: SquintSocket) => {
            this.setSS(ss);
         });
   }

   public close() {
      if (!this.connected) {
         debug('Squint.close() called but no connection exists');
         return;
      }

      this.ss.close();
      this.ss = null;
   }

   private processMessage(msg: ISquintMessage) {
      switch (msg.subject) {
         case 'UpdateConnectionInfo': {
            if (this.onUpdateConnectionInfo) {
               this.onUpdateConnectionInfo({
                  userName: msg.userName,
                  connectionId: msg.connectionId,
               })
            }
         }
            break;

         case 'SessionList': {
            if (this.onSessionList) {
               this.onSessionList(msg.sessions);
            }
         }
            break;

         case 'ChatMessage': {
            if (this.onChatMessage) {
               this.onChatMessage(msg.connection, msg.message);
            }
         }
            break;

         case 'ViewerList': {
            if (this.onViewerList) {
               this.onViewerList(msg.viewers);
            }
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

      this.ss.send(msg);
   }

   public sendImage(blob: Blob) {
      if (!this.connected) {
         debug('Squint.sendImage() called, but not connected');
         return;
      }

      if (this.bufferReady) {
         this.ss.sendImage(blob);
      }
      else {
         console.log('skipping upload, buffer not empty: ' + this.ss.bufferedAmount);
      }
   }

   public requestNextImage() {
      this.send({
         subject: 'ReadyForNextImage',
      });
   }

   // TODO do we really need to wait for a response?
   public createSession() {
      this.send({
         subject: 'CreateSession',
      });
   }

   public subscribe(connectionId: string) {
      this.send({
         subject: 'Subscribe',
         connectionId: connectionId,
      })
   }

   public updateConnectionInfo(userName: string) {
      this.userName = userName;
      this.send({
         subject: 'UpdateConnectionInfo',
         userName: this.connectionInfo.userName,
         connectionId: this.connectionInfo.connectionId,
      })
   }

   public sendChatMessage(msg: string) {
      this.send({
         subject: 'ChatMessage',
         message: msg,
         connection: this.connectionInfo,
      });
   }
}