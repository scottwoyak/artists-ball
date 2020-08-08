import { ISquintMessage } from "./Squint";
import { debug } from "./SquintApp";

export interface ISquintConnection {
   id: string,
   ws: WebSocket,
}

export class SquintConnector {
   public static connect(url: string, userName: string, reconnectId: string = undefined): Promise<ISquintConnection> {

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
                     resolve({ id: reconnectId, ws: ws });
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
                     resolve({ id: msg.id, ws: ws });
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