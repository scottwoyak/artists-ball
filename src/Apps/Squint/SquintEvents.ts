import { IConnectionInfoBasic, ISessionInfoBasic, ISessionInfoFull } from './SquintMessage';

export type CameraPauseHandler = () => void;
export type CameraRequestHandler = (resolution: number, jpegQuality: number) => void;
export type ChatMessageHandler = (source: IConnectionInfoBasic, msg: string) => void;
export type CloseHandler = () => void;
export type ConnectionInfoUpdateHandler = (info: IConnectionInfoBasic) => void;
export type HostChangedHandler = (newHostConnectionId: string) => void;
export type HostDisconnectedHandler = () => void;
export type ImageHandler = (img: Blob) => void;
export type ReconnectingHandler = () => void;
export type ReconnectedHandler = (success: boolean) => void;
export type SessionInfoHandler = (info: ISessionInfoFull) => void;
export type SessionListHandler = (session: ISessionInfoBasic[]) => void;

export enum SquintEvent {
   CameraPaused = 'cameraPaused',
   CameraRequest = 'cameraRequest',
   ChatMessage = 'chatMessage',
   Close = 'close',
   ConnectionInfoUpdate = 'connectionInfoUpdate',
   HostChanged = 'hostChanged',
   HostDisconnected = 'hostDisconnected',
   Image = 'image',
   Reconnecting = 'reconnecting',
   Reconnected = 'reconnected',
   SessionInfo = 'sessionInfo',
   SessionList = 'sessionList',
}

export interface ISquintCameraPausedEvent {
   event: SquintEvent.CameraPaused,
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

export interface ISquintConnectionInfoUpdateEvent {
   event: SquintEvent.ConnectionInfoUpdate,
   handler: ConnectionInfoUpdateHandler,
}

export interface ISquintHostChangedEvent {
   event: SquintEvent.HostChanged,
   handler: HostChangedHandler,
}

export interface ISquintHostDisconnectedEvent {
   event: SquintEvent.HostDisconnected,
   handler: HostDisconnectedHandler,
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

export type ISquintEventHandler =
   ISquintCameraPausedEvent |
   ISquintCameraRequestEvent |
   ISquintCloseEvent |
   ISquintChatMessageEvent |
   ISquintConnectionInfoUpdateEvent |
   ISquintHostChangedEvent |
   ISquintHostDisconnectedEvent |
   ISquintImageEvent |
   ISquintReconnectedEvent |
   ISquintReconnectingEvent |
   ISquintSessionInfoEvent |
   ISquintSessionListEvent;
