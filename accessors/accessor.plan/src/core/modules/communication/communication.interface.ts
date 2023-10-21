import { Queue } from 'src/config';
import { HttpMethod } from 'src/core/enums';

export interface ICommunicationPayload {
  httpMethod: HttpMethod;
  path: string;
  body?: unknown;
  headers: object;
}

export interface ICallbackInfo {
  callbackQueue: Queue;
  callbackPath: string;
  callerId: string;
  requestAction: IRequestAction;
}

export interface IQueueRequest<T> {
  payload: T;
  callbackInfo: ICallbackInfo;
}

export interface ICallbackMessage<T> {
  requestAction: IRequestAction;
  isSuccessful: boolean;
  resultMessage: string;
  callerId: string;
  result?: T;
}

export interface IRequestAction {
  httpMethod: HttpMethod;
  path: string;
}
