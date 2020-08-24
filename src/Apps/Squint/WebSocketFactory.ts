export type WebSocketCreateFunction = (url: string) => WebSocket;

// WebSocket isn't defined for testing. Can we define a shim?
export enum WebSocketReadyState {
   CONNECTING = 0,
   OPEN = 1,
   CLOSING = 2,
   CLOSED = 3
}

export class WebSocketFactory {
   public static create: WebSocketCreateFunction;
}