export type WebSocketCreateFunction = (url: string) => WebSocket;

export enum WebSocketReadyState {
   CONNECTING = 0,
   OPEN = 1,
   CLOSING = 2,
   CLOSED = 3
}

export class WebSocketFactory {
   public static create: WebSocketCreateFunction;
}