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

export enum CreateStatus {
   Success = 0,
   AlreadyInASession,
}

export enum JoinStatus {
   Success = 0,
   AlreadyInASession,
   SessionNotFound
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
   sessions: ISessionInfoFull[],
   sessionTimeoutMs: number,
   zombieTimeoutMs: number,
   intervalMs: number,
}

export enum SquintMessageSubject {
   CameraPaused = 'CameraPaused',
   CameraRequest = 'CameraRequest',
   ChatMessage = 'ChatMessage',
   ConnectionInfoUpdate = 'ConnectionInfoUpdate',
   CreateSession = 'CreateSession',
   Hello = 'Hello',
   HostChanged = 'HostChanged',
   HostChangeRequest = 'HostChangeRequest',
   HostDisconnected = 'HostDisconnected',
   JoinSession = 'JoinSession',
   Log = 'Log',
   ReadyForNextImage = 'ReadyForNextImage',
   Reconnected = 'Reconnected',
   SessionCreated = 'SessionCreated',
   SessionInfo = 'SessionInfo',
   SessionJoined = 'SessionJoined',
   SessionList = 'SessionList',
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

export interface ISquintConnectionInfoUpdateMessage {
   subject: SquintMessageSubject.ConnectionInfoUpdate,
   userName: string,
   connectionId: string,
}

export interface ISquintCreateSessionMessage {
   subject: SquintMessageSubject.CreateSession,
   requestId: string,
   sessionTitle: string,
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
   version: string,
   connectionId: string,
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
   subject: SquintMessageSubject.HostDisconnected
}

export interface ISquintJoinSessionMessage {
   subject: SquintMessageSubject.JoinSession,
   requestId: string, // value returned in the Joined response
   sessionId: string,
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

export interface ISquintSessionCreatedMessage {
   subject: SquintMessageSubject.SessionCreated,
   requestId: string,
   status: CreateStatus,
   sessionId?: string, // undefined if creation fails
}

export interface ISquintSessionInfoMessage {
   subject: SquintMessageSubject.SessionInfo,
   info: ISessionInfoFull,
}

export interface ISquintSessionJoinedMessage {
   subject: SquintMessageSubject.SessionJoined,
   requestId: string, // same value from the Join request
   status: JoinStatus,
}

export interface ISquintSessionListMessage {
   subject: SquintMessageSubject.SessionList,
   sessions: ISessionInfoBasic[],
}

// for type inference in TypeScript
export type ISquintMessage =
   ISquintCameraPausedMessage |
   ISquintCameraRequestMessage |
   ISquintChatMessage |
   ISquintConnectionInfoUpdateMessage |
   ISquintCreateSessionMessage |
   ISquintHelloFromClientMessage |
   ISquintHelloFromServerMessage |
   ISquintHostChangedMessage |
   ISquintHostChangeRequestMessage |
   ISquintHostDisconnectedMessage |
   ISquintJoinSessionMessage |
   ISquintLogMessage |
   ISquintReadyForNextImageMessage |
   ISquintReconnectedMessage |
   ISquintSessionCreatedMessage |
   ISquintSessionInfoMessage |
   ISquintSessionJoinedMessage |
   ISquintSessionListMessage;

