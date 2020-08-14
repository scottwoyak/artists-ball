
export interface ISquintChatMessage {
   subject: 'ChatMessage',
   connection: IConnectionInfo,
   message: string,
}

export interface ISquintHelloFromClientMessage {
   subject: 'Hello',
   userName: string,
   reconnectId: string,
   userAgent: string,
   platform: string
}

export interface ISquintHelloFromServerMessage {
   subject: 'Hello',
   id: string,
}

export interface ISquintReadyForNextImageMessage {
   subject: 'ReadyForNextImage',
}

export interface ISquintReconnectedMessage {
   subject: 'Reconnected',
}

export interface ISquintSessionListMessage {
   subject: 'SessionList',
   sessions: IConnectionInfo[],
}

export interface ISquintSubscribeMessage {
   subject: 'Subscribe',
   connectionId: string,
}

export interface ISquintUpdateConnectionInfoMessage {
   subject: 'UpdateConnectionInfo',
   userName: string,
   connectionId: string,
}

export interface ISquintViewerListMessage {
   subject: 'ViewerList',
   viewers: IConnectionInfo[],
}

// for type inference in TypeScript
export type ISquintMessage =
   ISquintChatMessage |
   ISquintHelloFromClientMessage |
   ISquintHelloFromServerMessage |
   ISquintReadyForNextImageMessage |
   ISquintReconnectedMessage |
   ISquintSessionListMessage |
   ISquintSubscribeMessage |
   ISquintUpdateConnectionInfoMessage |
   ISquintViewerListMessage;

export interface IConnectionInfo {
   userName: string,
   connectionId: string,
}

