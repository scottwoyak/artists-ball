import { SquintWsUrl as SquintWsUrl } from './Servers';
import { debug } from './SquintApp';
import { SquintSocket } from './SquintSocket';
import { ISquintMessage, SquintMessageSubject, ISquintInfo, IConnectionInfoBasic } from './SquintMessage';
import { EventManager } from './EventManager';
import { ISquintEventHandler, SquintEvent } from './SquintEvents';
import { WebSocketFactory } from './WebSocketFactory';


export class Squint {

   public static readonly url = SquintWsUrl;

   public ss: SquintSocket | null = null;
   public _userName: string | null = null;
   private _reconnecting = false;
   private _remoteCameraPaused = false;
   private _remoteCameraConnected = true;
   private _url: string | null;

   private eventManager = new EventManager();

   /**
    * For debugging only
    */
   public get ws(): WebSocket {
      return this.ss.ws;
   }

   public get userName(): string {
      if (this._userName === null) {
         return 'Unknown';
      }
      else {
         return this._userName;
      }
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

      // @ts-ignore: cannot be null - we check above
      return this.ss.bufferedAmount === 0;
   }

   public get connectionInfo(): IConnectionInfoBasic {
      return {
         connectionId: this.connectionId,
         userName: this.userName,
      }
   }

   public get connectionId(): string {
      return (this.ss !== null) ? this.ss.connectionId : 'WebSocket not connected'
   }

   public set localCameraPaused(value: boolean) {
      this.send({
         subject: SquintMessageSubject.CameraPaused,
      })
   }

   public get remoteCameraPaused(): boolean {
      return this._remoteCameraPaused;
   }

   public get remoteCameraConnected(): boolean {
      return this._remoteCameraConnected;
   }

   public on(handler: ISquintEventHandler): void {
      this.eventManager.on(handler.event, handler.handler);
   }

   public remove(handler: ISquintEventHandler): void {
      this.eventManager.remove(handler.event, handler.handler);
   }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   private emit(name: SquintEvent, ...args: any[]) {
      this.eventManager.emit(name, args[0], args[1], args[2], args[3], args[4], args[5], args[6], args[8], args[9]);
   }

   private processMessage(msg: ISquintMessage) {
      switch (msg.subject) {
         case SquintMessageSubject.CameraPaused: {
            this._remoteCameraPaused = true;
            this.eventManager.emit(SquintEvent.CameraPause);
         }
            break;

         case SquintMessageSubject.CameraRequest: {
            this.emit(SquintEvent.CameraRequest, msg.resolution, msg.jpegQuality);
         }
            break;

         case SquintMessageSubject.ChatMessage: {
            this.emit(SquintEvent.ChatMessage, msg.connection, msg.message);
         }
            break;

         case SquintMessageSubject.HostChanged: {
            this.emit(SquintEvent.HostChanged, msg.newHostConnectionId);
         }
            break;

         case SquintMessageSubject.HostDisconnected: {
            this._remoteCameraConnected = false;
            this.emit(SquintEvent.HostDisconnected);
         }
            break;

         case SquintMessageSubject.HostReconnected: {
            this._remoteCameraConnected = true;
            this.emit(SquintEvent.HostReconnected);
         }
            break;

         case SquintMessageSubject.SessionList: {
            this.emit(SquintEvent.SessionList, msg.sessions);
         }
            break;

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

         case SquintMessageSubject.SessionInfo: {
            this.emit(SquintEvent.SessionInfo, msg.info);
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

   public tryToReconnect(connectionId: string, retryCount = 1): void {
      this._reconnecting = true;
      if (retryCount === 1) {
         this.emit(SquintEvent.Reconnecting);
      }
      console.log(this + ' Reconnect try ' + retryCount)
      this.doConnect(connectionId)
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

   public connect(url: string, userName: string): Promise<void> {
      this._userName = userName;
      this._url = url;
      this._remoteCameraConnected = true;
      this._remoteCameraPaused = false;
      return this.doConnect();
   }

   private doConnect(reconnectId?: string): Promise<void> {

      if (this.connected) {
         return Promise.reject('Cannot connect to server: previous connection is still open');
      }

      let onMessage = (msg: ISquintMessage) => {
         if (!this.ss.connected) {
            debug('ws.onMessage() message received, but socket not open');
         }

         // process the image
         this.processMessage(msg);
      };

      let onImage = (blob: Blob) => {
         if (!this.ss.connected) {
            debug('ss.onImage() message received, but socket not open');
         }

         this._remoteCameraPaused = false;
         this._remoteCameraConnected = true;
         this.emit(SquintEvent.Image, blob);
      }

      let onClose = (code: number) => {
         const connectionId = this.ss.connectionId;
         if (code === SquintSocket.NORMAL_CLOSURE) {
            this.ss = null;
            this.emit(SquintEvent.Close);
         }
         else {
            console.log(this + ' WebSocket closed with code: ' + code + ', trying to reconnect');
            this.tryToReconnect(connectionId);
         }
      }

      return SquintSocket.connect(
         this._url,
         this.userName,
         onMessage,
         onImage,
         onClose,
         (ss) => { this.ss = ss; },
         reconnectId,
      )
         .then((ss) => { });
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

   public subscribe(sessionId: string): void {
      this.send({
         subject: SquintMessageSubject.Subscribe,
         sessionId: sessionId,
      })
   }

   public updateConnectionInfo(userName: string): void {
      this._userName = userName;
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

   public sendCameraRequest(resolution: number, jpegQuality: number): void {
      this.send({
         subject: SquintMessageSubject.CameraRequest,
         resolution,
         jpegQuality,
      })
   }

   public requestToBeHost(): void {
      this.send({
         subject: SquintMessageSubject.HostChangeRequest
      });
   }

   public static inspect(url: string): Promise<ISquintInfo> {
      return new Promise<ISquintInfo>((resolve, reject) => {
         let ws = WebSocketFactory.create(url);

         ws.onopen = () => {
            ws.send('inspect');
         }

         ws.onmessage = (msg) => {
            ws.onopen = null;
            ws.onclose = null;
            ws.onerror = null;
            ws.onmessage = null;

            try {
               resolve(JSON.parse(msg.data));
            }
            catch (err) {
               reject('Invalid inspect response: ' + err + '\n' +
                  'Message: ' + msg.data);
            }
         }

         ws.onclose = (event: CloseEvent) => {
            reject('WebSocket closed with code ' + event.code);
         }

         ws.onerror = () => {
            reject('WebSocket error');
         }
      });
   }

   public toString(): string {
      if (this.ss) {
         return '[' + this.ss.readyStateStr + ']';
      }
      else {
         return '[websocket=null]';
      }
   }
}