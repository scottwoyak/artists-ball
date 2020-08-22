export interface IConnectionInfo {
   userName: string,
   connectionId: string,
}

export interface ISessionInfo {
   title: string,
   sessionId: string,
}

export enum SquintMessageSubject {
   CameraPaused = 'CameraPaused',
   CameraRequest = 'CameraRequest',
   ChatMessage = 'ChatMessage',
   Hello = 'Hello',
   HostDisconnected = 'HostDisconnected',
   HostReconnected = 'HostReconnected',
   Log = 'Log',
   ReadyForNextImage = 'ReadyForNextImage',
   Reconnected = 'Reconnected',
   SessionList = 'SessionList',
   Subscribe = 'Subscribe',
   UpdateConnectionInfo = 'UpdateConnectionInfo',
   ViewerList = 'ViewerList',
}

export interface ISquintCameraPausedMessage {
   subject: SquintMessageSubject.CameraPaused,
}

export interface ISquintCameraRequestMessage {
   subject: SquintMessageSubject.CameraRequest,
   resolution: number // 0-1
   jpegQuality: number // 0.1-1
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

export interface ISquintHostDisconnectedMessage {
   subject: SquintMessageSubject.HostDisconnected,
   shutdownSecs: number, // time remaining in seconds
}

export interface ISquintHostReconnectedMessage {
   subject: SquintMessageSubject.HostReconnected,
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
   sessions: ISessionInfo[],
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
   ISquintCameraPausedMessage |
   ISquintCameraRequestMessage |
   ISquintChatMessage |
   ISquintHelloFromClientMessage |
   ISquintHelloFromServerMessage |
   ISquintHostDisconnectedMessage |
   ISquintHostReconnectedMessage |
   ISquintLogMessage |
   ISquintReadyForNextImageMessage |
   ISquintReconnectedMessage |
   ISquintSessionListMessage |
   ISquintSubscribeMessage |
   ISquintUpdateConnectionInfoMessage |
   ISquintViewerListMessage;

