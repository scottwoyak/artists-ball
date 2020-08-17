export enum SquintMessageSubject {
   ChatMessage = 'ChatMessage',
   Hello = 'Hello',
   Log = 'Log',
   ReadyForNextImage = 'ReadyForNextImage',
   Reconnected = 'Reconnected',
   SessionList = 'SessionList',
   Subscribe = 'Subscribe',
   UpdateConnectionInfo = 'UpdateConnectionInfo',
   ViewerList = 'ViewerList',
}

export interface ISquintChatMessage {
   subject: SquintMessageSubject.ChatMessage,
   connection: IConnectionInfo,
   message: string,
}

export interface ISquintHelloFromClientMessage {
   subject: SquintMessageSubject.Hello,
   userName: string,
   reconnectId: string,
   userAgent: string,
   platform: string
}

export interface ISquintHelloFromServerMessage {
   subject: SquintMessageSubject.Hello,
   id: string,
}

export interface ISquintLogMessage {
   subject: SquintMessageSubject.Log,
   message: string,
}

export interface ISquintReadyForNextImageMessage {
   subject: SquintMessageSubject.ReadyForNextImage,
}

export interface ISquintReconnectedMessage {
   subject: SquintMessageSubject.Reconnected,
}

export interface ISquintSessionListMessage {
   subject: SquintMessageSubject.SessionList,
   sessions: IConnectionInfo[],
}

export interface ISquintSubscribeMessage {
   subject: SquintMessageSubject.Subscribe,
   connectionId: string,
}

export interface ISquintUpdateConnectionInfoMessage {
   subject: SquintMessageSubject.UpdateConnectionInfo,
   userName: string,
   connectionId: string,
}

export interface ISquintViewerListMessage {
   subject: SquintMessageSubject.ViewerList,
   viewers: IConnectionInfo[],
}

// for type inference in TypeScript
export type ISquintMessage =
   ISquintChatMessage |
   ISquintHelloFromClientMessage |
   ISquintHelloFromServerMessage |
   ISquintLogMessage |
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

