import { SquintWsUrl as SquintWsUrl } from './Servers';
import { debug } from './SquintApp';
import { SquintSocket } from './SquintSocket';
import { ISquintMessage, IConnectionInfo, SquintMessageSubject } from './SquintMessage';
import { EventManager } from './EventManager';
import { ISquintEventHandler, SquintEvent } from './SquintEvents';


export class Squint {

   public static readonly url = SquintWsUrl;

   public ss: SquintSocket | null = null;
   public userName: string;
   private _reconnecting = false;

   private eventManager = new EventManager();

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

      // @ts-ignore: cannot be null - we check above
      return this.ss.bufferedAmount === 0;
   }

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

   public on(handler: ISquintEventHandler): void {
      this.eventManager.on(handler.name, handler.handler);
   }

   public remove(handler: ISquintEventHandler): void {
      this.eventManager.remove(handler.name, handler.handler);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private emit(name: SquintEvent, ...args: any[]) {
      this.eventManager.emit(name, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[8], args[9]);
   }

   private setSS(ss: SquintSocket) {

      this.ss = ss;

      ss.onClose = (code: number) => {
         const connectionId = ss.connectionId;
         this.ss = null;
         if (code === SquintSocket.NORMAL_CLOSURE) {
            this.emit(SquintEvent.Close);
         }
         else {
            console.log(this + ' Websocket closed with code: ' + code + ', trying to reconnect');
            this._reconnecting = true;
            this.tryToReconnect(connectionId);
         }
      }

      ss.onImage = (blob: Blob) => {
         if (!ss.connected) {
            debug('ss.onImage() message received, but socket not open');
         }

         this.emit(SquintEvent.Image, blob);
      }

      ss.onMessage = (msg: ISquintMessage) => {
         if (!ss.connected) {
            debug('ws.onMessage() message received, but socket not open');
         }

         // process the image
         this.processMessage(msg);
      };
   }

   private tryToReconnect(connectionId: string, retryCount = 1) {
      this._reconnecting = true;
      if (retryCount === 1) {
         this.emit(SquintEvent.Reconnecting);
      }
      console.log(this + ' Reconnect try ' + retryCount + ' ' + this.connected)
      this.reconnect(SquintWsUrl, connectionId)
         .then(() => {
            this._reconnecting = false;
            this.emit(SquintEvent.Reconnected, true);
         })
         .catch((err) => {
            console.log(this + ' Reconnect try ' + retryCount + ' failed: ' + err);
            if (retryCount < 3) {
               setTimeout(() => {
                  this.tryToReconnect(connectionId, retryCount + 1);
               }, 1000);
            }
            else {
               console.log(this + ' Unable to reconnect. Passing along failure.');
               this._reconnecting = false;
               this.ss = null;
               this.emit(SquintEvent.Reconnected, false);
               this.emit(SquintEvent.Close);
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

   private doConnect(url: string, reconnectId?: string): Promise<void> {

      if (this.connected) {
         return Promise.reject('Cannot connect to server: previous connection is still open');
      }

      return SquintSocket.connect(url, this.userName, reconnectId)
         .then((ss: SquintSocket) => {
            this.setSS(ss);
         });
   }

   public close(): void {
      if (!this.connected) {
         debug('Squint.close() called but no connection exists');
         return;
      }

      // @ts-ignore: cannot be null - we check above
      this.ss.close();
      this.ss = null;

      this.emit(SquintEvent.Close);
   }

   private processMessage(msg: ISquintMessage) {
      switch (msg.subject) {
         case SquintMessageSubject.UpdateConnectionInfo: {
            this.emit(
               SquintEvent.UpdateConnectionInfo,
               {
                  userName: msg.userName,
                  connectionId: msg.connectionId,
               }
            );
         }
            break;

         case SquintMessageSubject.SessionList: {
            this.emit(SquintEvent.SessionList, msg.sessions);
         }
            break;

         case SquintMessageSubject.ChatMessage: {
            this.emit(SquintEvent.ChatMessage, msg.connection, msg.message);
         }
            break;

         case SquintMessageSubject.ViewerList: {
            this.emit(SquintEvent.ViewerList, msg.viewers);
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

      // @ts-ignore: cannot be null - we check above
      this.ss.send(msg);
   }

   public sendImage(blob: Blob): void {
      if (!this.connected) {
         debug('Squint.sendImage() called, but not connected');
         return;
      }

      if (this.bufferReady) {
         // @ts-ignore: cannot be null - we check above
         this.ss.sendImage(blob);
      }
      else {
         // @ts-ignore: cannot be null - we check above
         console.error('Skipping upload, buffer not empty: ' + this.ss.bufferedAmount);
      }
   }

   public requestNextImage(): void {
      this.send({
         subject: SquintMessageSubject.ReadyForNextImage,
      });
   }

   public subscribe(connectionId: string): void {
      this.send({
         subject: SquintMessageSubject.Subscribe,
         connectionId: connectionId,
      })
   }

   public updateConnectionInfo(userName: string): void {
      this.userName = userName;
      this.send({
         subject: SquintMessageSubject.UpdateConnectionInfo,
         userName: this.connectionInfo.userName,
         connectionId: this.connectionInfo.connectionId,
      })
   }

   public sendChatMessage(msg: string): void {
      this.send({
         subject: SquintMessageSubject.ChatMessage,
         message: msg,
         connection: this.connectionInfo,
      });
   }

   public log(msg: string): void {
      if (this.connected) {
         this.send({
            subject: SquintMessageSubject.Log,
            message: msg,
         });
      }
   }

   public toString(): string {
      if (this.ss) {
         return '[' + this.ss.readyStateStr + ']';
      }
      else {
         return '[null]';
      }
   }
}