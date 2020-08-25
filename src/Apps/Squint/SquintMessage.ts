//
// This file should be the same in both the Squint and SquintServer projects
//

export enum ConnectionState {
   Zombie = 'ZOMBIE',
   Open = 'OPEN',
   Closed = 'CLOSED',
   Connecting = 'CONNECTING',
   Closing = 'CLOSING',
   Unknown = 'UNKNOWN',
}

export interface IConnectionInfoBasic {
   userName: string,
   connectionId: string,
}

export interface IConnectionInfoFull extends IConnectionInfoBasic {
   state: ConnectionState
}

export interface ISessionInfoBasic {
   title: string,
   sessionId: string,
}

export interface ISessionInfoFull extends ISessionInfoBasic {
   host?: IConnectionInfoFull,
   viewers: IConnectionInfoFull[]
}

export interface ISquintInfo {
   connections: IConnectionInfoFull[],
   sessions: ISessionInfoFull[]
}

export enum SquintMessageSubject {
   CameraPaused = 'CameraPaused',
   CameraRequest = 'CameraRequest',
   ChatMessage = 'ChatMessage',
   Hello = 'Hello',
   HostChanged = 'HostChanged',
   HostChangeRequest = 'HostChangeRequest',
   HostDisconnected = 'HostDisconnected',
   HostReconnected = 'HostReconnected',
   Log = 'Log',
   ReadyForNextImage = 'ReadyForNextImage',
   Reconnected = 'Reconnected',
   SessionInfo = 'SessionInfo',
   SessionList = 'SessionList',
   Subscribe = 'Subscribe',
   UpdateConnectionInfo = 'UpdateConnectionInfo',
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
   connection: IConnectionInfoBasic,
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

export interface ISquintHostChangedMessage {
   subject: SquintMessageSubject.HostChanged,
   sessionId: string,
   newHostConnectionId: string,
}

export interface ISquintHostChangeRequestMessage {
   subject: SquintMessageSubject.HostChangeRequest,
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

export interface ISquintSessionInfoMessage {
   subject: SquintMessageSubject.SessionInfo,
   info: ISessionInfoFull,
}

export interface ISquintSessionListMessage {
   subject: SquintMessageSubject.SessionList,
   sessions: ISessionInfoBasic[],
}

export interface ISquintSubscribeMessage {
   subject: SquintMessageSubject.Subscribe,
   sessionId: string,
}

export interface ISquintUpdateConnectionInfoMessage {
   subject: SquintMessageSubject.UpdateConnectionInfo,
   userName: string,
   connectionId: string,
}

// for type inference in TypeScript
export type ISquintMessage =
   ISquintCameraPausedMessage |
   ISquintCameraRequestMessage |
   ISquintChatMessage |
   ISquintHelloFromClientMessage |
   ISquintHelloFromServerMessage |
   ISquintHostChangedMessage |
   ISquintHostChangeRequestMessage |
   ISquintHostDisconnectedMessage |
   ISquintHostReconnectedMessage |
   ISquintLogMessage |
   ISquintReadyForNextImageMessage |
   ISquintReconnectedMessage |
   ISquintSessionInfoMessage |
   ISquintSessionListMessage |
   ISquintSubscribeMessage |
   ISquintUpdateConnectionInfoMessage;

