import { IConnectionInfoBasic, ISessionInfoBasic, ISessionInfoFull } from './SquintMessage';

export type CameraPauseHandler = () => void;
export type CameraRequestHandler = (resolution: number, jpegQuality: number) => void;
export type ChatMessageHandler = (source: IConnectionInfoBasic, msg: string) => void;
export type CloseHandler = () => void;
export type HostDisconnectedHandler = (shutdownSecs: number) => void;
export type HostReconnectedHandler = () => void;
export type ImageHandler = (img: Blob) => void;
export type ReconnectingHandler = () => void;
export type ReconnectedHandler = (success: boolean) => void;
export type SessionInfoHandler = (info: ISessionInfoFull) => void;
export type SessionListHandler = (session: ISessionInfoBasic[]) => void;
export type UpdateConnectionInfoHandler = (info: IConnectionInfoBasic) => void;

export enum SquintEvent {
   CameraPause = 'cameraPause',
   CameraRequest = 'cameraRequest',
   ChatMessage = 'chatMessage',
   Close = 'close',
   HostDisconnected = 'hostDisconnected',
   HostReconnected = 'hostReconnected',
   Image = 'image',
   Reconnecting = 'reconnecting',
   Reconnected = 'reconnected',
   SessionInfo = 'sessionInfo',
   SessionList = 'sessionList',
   UpdateConnectionInfo = 'updateConnectionInfo',
}

export interface ISquintCameraPauseEvent {
   event: SquintEvent.CameraPause,
   handler: CameraPauseHandler,
}

export interface ISquintCameraRequestEvent {
   event: SquintEvent.CameraRequest,
   handler: CameraRequestHandler,
}

export interface ISquintChatMessageEvent {
   event: SquintEvent.ChatMessage,
   handler: ChatMessageHandler,
}

export interface ISquintCloseEvent {
   event: SquintEvent.Close,
   handler: CloseHandler,
}

export interface ISquintHostDisconnectedEvent {
   event: SquintEvent.HostDisconnected,
   handler: HostDisconnectedHandler,
}

export interface ISquintHostReconnectedEvent {
   event: SquintEvent.HostReconnected,
   handler: HostReconnectedHandler,
}

export interface ISquintImageEvent {
   event: SquintEvent.Image,
   handler: ImageHandler,
}

export interface ISquintReconnectedEvent {
   event: SquintEvent.Reconnected,
   handler: ReconnectedHandler,
}

export interface ISquintReconnectingEvent {
   event: SquintEvent.Reconnecting,
   handler: ReconnectingHandler,
}

export interface ISquintSessionInfoEvent {
   event: SquintEvent.SessionInfo,
   handler: SessionInfoHandler,
}

export interface ISquintSessionListEvent {
   event: SquintEvent.SessionList,
   handler: SessionListHandler,
}

export interface ISquintUpdateConnectionInfoEvent {
   event: SquintEvent.UpdateConnectionInfo,
   handler: UpdateConnectionInfoHandler,
}

export type ISquintEventHandler =
   ISquintCameraPauseEvent |
   ISquintCameraRequestEvent |
   ISquintCloseEvent |
   ISquintChatMessageEvent |
   ISquintHostDisconnectedEvent |
   ISquintHostReconnectedEvent |
   ISquintImageEvent |
   ISquintReconnectedEvent |
   ISquintReconnectingEvent |
   ISquintSessionInfoEvent |
   ISquintSessionListEvent |
   ISquintUpdateConnectionInfoEvent;
