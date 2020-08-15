import { IConnectionInfo } from './SquintMessage';

export type CloseHandler = () => void;
export type ImageHandler = (img: Blob) => void;
export type SessionListHandler = (session: IConnectionInfo[]) => void;
export type ViewerListHandler = (session: IConnectionInfo[]) => void;
export type ChatMessageHandler = (source: IConnectionInfo, msg: string) => void;
export type ReconnectingHandler = () => void;
export type ReconnectedHandler = (success: boolean) => void;
export type UpdateConnectionInfoHandler = (info: IConnectionInfo) => void;

export enum SquintEvent {
   ChatMessage = 'chatMessage',
   Close = 'close',
   Image = 'image',
   Reconnecting = 'reconnecting',
   Reconnected = 'reconnected',
   SessionList = 'sessionList',
   UpdateConnectionInfo = 'updateConnectionInfo',
   ViewerList = 'viewerList',
}

export interface ISquintChatMessageEvent {
   name: SquintEvent.ChatMessage,
   handler: ChatMessageHandler,
}

export interface ISquintCloseEvent {
   name: SquintEvent.Close,
   handler: CloseHandler,
}

export interface ISquintImageEvent {
   name: SquintEvent.Image,
   handler: ImageHandler,
}

export interface ISquintReconnectedEvent {
   name: SquintEvent.Reconnected,
   handler: ReconnectedHandler,
}

export interface ISquintReconnectingEvent {
   name: SquintEvent.Reconnecting,
   handler: ReconnectingHandler,
}

export interface ISquintSessionListEvent {
   name: SquintEvent.SessionList,
   handler: SessionListHandler,
}

export interface ISquintUpdateConnectionInfoEvent {
   name: SquintEvent.UpdateConnectionInfo,
   handler: UpdateConnectionInfoHandler,
}

export interface ISquintViewerListEvent {
   name: SquintEvent.ViewerList,
   handler: ViewerListHandler,
}

export type ISquintEventHandler =
   ISquintCloseEvent |
   ISquintChatMessageEvent |
   ISquintImageEvent |
   ISquintReconnectedEvent |
   ISquintReconnectingEvent |
   ISquintSessionListEvent |
   ISquintUpdateConnectionInfoEvent |
   ISquintViewerListEvent;
