import { ISquintMessage, ISquintHelloFromServerMessage, ReconnectedStatus, ISquintHelloFromClientMessage, SquintMessageSubject } from './SquintMessage';
import { debug } from './SquintApp';
import { WebSocketFactory, WebSocketReadyState } from './WebSocketFactory';
import { env } from '../../Util/Globals';
import { Version } from './Version';

export type ImageHandler = (img: Blob) => void;
export type MessageHandler = (msg: ISquintMessage) => void;
export type CloseHandler = (code: number) => void;
export type InitHandler = (ss: SquintSocket) => void;

export class SquintSocket {

   private _ws: WebSocket | null = null;
   public readonly connectionId: string;

   private onImage: ImageHandler;
   private onMessage: MessageHandler;
   private onClose: CloseHandler;

   public static readonly CLOSE_CODE_NORMAL = 1000;

   /**
    * For debugging only
    */
   public get ws(): WebSocket {
      return this._ws;
   }

   public get url(): string {
      if (this._ws) {
         return this._ws.url;
      }
      else {
         return '';
      }
   }

   public get readyState(): number {
      if (this._ws === null) {
         return WebSocketReadyState.CLOSED;
      }
      else {
         return this._ws.readyState;
      }
   }

   public get readyStateStr(): string {
      if (this._ws === null) {
         return 'CLOSED';
      }

      switch (this._ws.readyState) {
         case WebSocketReadyState.OPEN:
            return 'OPEN';

         case WebSocketReadyState.CLOSED:
            return 'CLOSED';

         case WebSocketReadyState.CONNECTING:
            return 'CONNECTING';

         case WebSocketReadyState.CLOSING:
            return 'CLOSING';

         default:
            return 'UNKNOWN';
      }
   }

   public get bufferedAmount(): number {
      if (this._ws) {
         return this._ws.bufferedAmount;
      }
      else {
         debug('SquintSocket.bufferedAmount called, but not connected');
         return 0;
      }
   }

   public get connected(): boolean {
      return (this._ws !== null && this._ws.readyState === WebSocketReadyState.OPEN);
   }

   public get bufferReady(): boolean {
      if (!this.connected) {
         debug('SquintSocket.bufferReady() called after websocket was disconnected');
         return false;
      }

      return this.bufferedAmount === 0;
   }

   private constructor(
      ws: WebSocket,
      connectionId: string,
      onMessage: MessageHandler,
      onImage: ImageHandler,
      onClose: CloseHandler
   ) {

      this._ws = ws;
      this.connectionId = connectionId;
      this.onMessage = onMessage;
      this.onImage = onImage;
      this.onClose = onClose;

      ws.onopen = null;

      ws.onclose = (event: CloseEvent) => {
         if (this._ws) {
            this._ws.onclose = null;
            this._ws.onerror = null;
            this._ws.onmessage = null;
            this._ws.onopen = null;
         }
         this._ws = null;
         this.onClose(event.code);
      }

      ws.onerror = (event: Event) => {
         debug('SquintSocket.onError: ' + JSON.stringify(event, null, ' '));
      }

      ws.onmessage = (message: MessageEvent) => {
         if (ws.readyState !== WebSocketReadyState.OPEN) {
            debug('ws.onmessage() message received, but socket not open');
         }

         // process the image
         if (message.data instanceof Blob) {
            this.onImage(message.data);
         }
         else if (typeof message.data === 'string') {
            try {
               let msg = JSON.parse(message.data) as ISquintMessage;

               try {
                  this.onMessage(msg);
               }
               catch (err) {
                  console.log('SquintSocket.onMessage() exception: ' + err);
               }
            }
            catch (err) {
               console.log('Invalid message received: Invalid JSON.\n' + err + '\n' + message.data);
            }
         }
         else {
            // Hate to modify our code to make it work with tests, but I don't know how else to
            // address this situation. We're testing using NodeJS which uses different types
            // than a browser. In particular it doesn't support Blobs so when we test sending
            // an image, it is not recognized as a Blob type. Ugh.
            if (env.isTesting) {
               this.onImage(message.data);
            }
            else {
               debug('SquintSocket: unknown message received: ' + JSON.stringify(message, null, ' ').substring(0, 10000));
            }
         }
      };
   }

   public close(code = SquintSocket.CLOSE_CODE_NORMAL): void {
      if (!this.connected) {
         debug('SquintSocket.close() called but no connection exists');
         return;
      }

      if (this._ws) {
         this._ws.onclose = null;
         this._ws.onerror = null;
         this._ws.onmessage = null;
         this._ws.onopen = null;

         this._ws.close(code);
      }
      this._ws = null;
   }

   public send(msg: ISquintMessage): void {
      if (!(this.connected)) {
         debug('SquintSocket.send() called, but not connected');
         return;
      }

      // @ts-ignore: can't be null per above check
      this._ws.send(JSON.stringify(msg));
   }

   public sendImage(blob: Blob): void {
      if (!this.connected) {
         debug('SquintSocket.sendImage() called, but not connected');
         return;
      }

      // @ts-ignore: can't be null per above check
      this._ws.send(blob);
   }

   public static connect(
      url: string,
      userName: string,
      onMessage: MessageHandler,
      onImage: ImageHandler,
      onClose: CloseHandler,
      onInit: InitHandler,
      reconnectId?: string
   ): Promise<SquintSocket> {

      return new Promise<SquintSocket>((resolve, reject) => {

         // create temporary handlers that process the server handshake
         const ws = WebSocketFactory.create(url);

         ws.onopen = () => {
            // send handshake message
            let msg: ISquintHelloFromClientMessage = {
               subject: SquintMessageSubject.Hello,
               userName: userName,
               reconnectId: reconnectId,
               userAgent: navigator.userAgent,
               platform: navigator.platform,
               version: Version.toString(),
            }
            ws.send(
               JSON.stringify({
               } as ISquintHelloFromClientMessage)
            );
         };

         ws.onclose = (event: CloseEvent) => {
            ws.onopen = null;
            ws.onclose = null;
            ws.onmessage = null;
            reject('Cannot connect to server: ' + event.code);
         }
         ws.onerror = (event: Event) => {
            debug('SquintSocket.onError() ' + JSON.stringify(event, null, ' '));
            ws.onopen = null;
            ws.onclose = null;
            ws.onmessage = null;
            reject('Cannot connect to ' + url);
         };

         ws.onmessage = (messageEvent) => {
            if (reconnectId) {
               try {
                  const msg = JSON.parse(messageEvent.data) as ISquintMessage;
                  if (msg.subject && msg.subject === 'Reconnected') {
                     if (msg.status === ReconnectedStatus.Success) {
                        let ss = new SquintSocket(
                           ws,
                           reconnectId,
                           onMessage,
                           onImage,
                           onClose
                        );
                        onInit(ss);
                        resolve(ss);
                     }
                     else {
                        reject('Cannot reconnect to ' + url + '\n\nServer rejected the request.');
                     }
                  }
                  else {
                     debug('Expected Reconnected response, got: ' + JSON.stringify(msg, null, ' '));
                     reject('Cannot reconnect to ' + url + '\n\nInvalid server handshake.');
                  }
               }
               catch (err) {
                  debug('Expected Reconnect response, got: ' + messageEvent.data);
                  reject('Cannot reconnect to ' + url + '\n\nInvalid server handshake.');
               }
            }
            else {
               try {
                  let msg = JSON.parse(messageEvent.data) as ISquintMessage;
                  if (msg.subject && msg.subject === 'Hello') {
                     msg = msg as ISquintHelloFromServerMessage;
                     console.log('Squint connection established. ID=' + msg.connectionId);
                     let ss = new SquintSocket(
                        ws,
                        msg.connectionId,
                        onMessage,
                        onImage,
                        onClose
                     );
                     // there is a very tricky potential bug here. After resolve() is called,
                     // but before the associated then() method is called, a message may be
                     // received on the socket. That's why we need the onInit() handler
                     onInit(ss);
                     resolve(ss);
                  }
                  else {
                     debug('Expected Hello response, got: ' + JSON.stringify(msg, null, ' '));
                     reject('Cannot connect to ' + url + '\n\nInvalid server handshake.');
                  }
               }
               catch (err) {
                  debug('Expected Hello response, got: ' + messageEvent.data);
                  reject('Cannot connect to ' + url + '\n\nInvalid server handshake.');
               }
            }
         }
      });
   }
}