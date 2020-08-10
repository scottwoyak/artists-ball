import { debug } from "./SquintApp";

export interface ISquintMessage {
   [prop: string]: any,
   subject:
   'UpdateConnectionInfo' |
   'CreateSession' |
   'SessionList' |
   'Subscribe' |
   'ReadyForNextImage' |
   'Reconnected' |
   'Hello',
}

export interface IConnectionInfo {
   userName: string,
   connectionId?: string,
}

export type ImageHandler = (img: Blob) => void;
export type MessageHandler = (msg: ISquintMessage) => void;
export type CloseHandler = (code: number) => void;

export class SquintSocket {

   private ws: WebSocket;
   public readonly connectionId: string;

   public onImage: ImageHandler;
   public onMessage: MessageHandler;
   public onClose: CloseHandler;

   public static readonly ERROR_CLOSURE = -1;
   public static readonly NORMAL_CLOSURE = 1000;

   public get bufferedAmount(): number {
      return this.ws.bufferedAmount;
   }

   private constructor(ws: WebSocket, connectionId: string) {
      this.ws = ws;
      this.connectionId = connectionId;

      ws.onopen = null;

      ws.onclose = (event: CloseEvent) => {
         this.ws.onclose = null;
         this.ws.onerror = null;
         this.ws.onmessage = null;
         this.ws.onopen = null;
         this.ws = null;
         this.onClose(event.code);
      }

      ws.onerror = (event: Event) => {
         if (this.onClose) {
            this.onClose(SquintSocket.ERROR_CLOSURE);
         }
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
               let msg = JSON.parse(message.data) as ISquintMessage;
               if (this.onMessage) {
                  this.onMessage(msg);
               }
            }
            catch (err) {
               console.log('Invalid message not received: Invalid JSON.\n' + message.data);
            }
         }
         else {
            debug('SquintSocket: unknown message received: ' + JSON.stringify(message, null, ' '));
         }
      };
   }

   public get connected(): boolean {
      return (this.ws && this.ws.readyState === WebSocket.OPEN);
   }

   public get bufferReady(): boolean {
      if (!this.connected) {
         debug('SquintSocket.bufferReady() called after websocket was disconnected');
         return false;
      }

      return this.ws.bufferedAmount === 0;
   }

   public close() {
      if (!this.connected) {
         debug('SquintSocket.close() called but no connection exists');
         return;
      }

      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;

      this.ws.close(SquintSocket.NORMAL_CLOSURE);
      this.ws = null;
   }


   public send(msg: ISquintMessage) {
      if (!this.connected) {
         debug('SquintSocket.send() called, but not connected');
         return;
      }

      this.ws.send(JSON.stringify(msg));
   }

   public sendImage(blob: Blob) {
      if (!this.connected) {
         debug('SquintSocket.sendImage() called, but not connected');
         return;
      }

      this.ws.send(blob);
   }

   public static connect(url: string, userName: string, reconnectId: string = undefined): Promise<SquintSocket> {

      return new Promise((resolve, reject) => {

         // create temporary handlers that process the server handshake
         let ws = new WebSocket(url);

         ws.onopen = () => {
            // send handshake message
            ws.send(
               JSON.stringify({
                  subject: 'Hello',
                  userName: userName,
                  reconnectId: reconnectId,
                  userAgent: navigator.userAgent,
                  platform: navigator.platform
               })
            );
         };

         ws.onclose = (event) => {
            reject('Cannot connect to server: ' + event.code);
         }
         ws.onerror = (event: Event) => {
            reject('Cannot connect to ' + url);
         };

         ws.onmessage = (messageEvent) => {
            if (reconnectId) {
               try {
                  let msg = JSON.parse(messageEvent.data) as ISquintMessage;
                  if (msg.subject && msg.subject === 'Reconnected') {
                     resolve(new SquintSocket(ws, reconnectId));
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
                     console.log('Squint connection established. ID=' + msg.id);
                     resolve(new SquintSocket(ws, msg.id));
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