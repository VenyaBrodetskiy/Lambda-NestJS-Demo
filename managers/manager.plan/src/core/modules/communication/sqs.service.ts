import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  ICallbackInfo,
  ICallbackMessage,
  ICommunicationPayload,
  IQueueRequest,
} from './communication.interface';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { CommunicationException } from './lambda.exception';
import { Configuration, Queue } from 'src/config';
import { HttpMethod } from 'src/core/enums/httpmethod.enum';

@Injectable()
export class SqsService {
  private readonly client: SQSClient;
  private readonly logger = new Logger(SqsService.name);
  constructor(private readonly config: Configuration) {
    this.client = config.IsOffline
      ? new SQSClient({ endpoint: config.SqsEndpoint })
      : new SQSClient({});
  }

  public async sendMessage<T extends object>(
    queue: Queue,
    path: string,
    httpMethod: HttpMethod = HttpMethod.Post,
    callbackInfo: ICallbackInfo,
    payload?: T,
  ): Promise<HttpStatus> {
    try {
      const queueBody: IQueueRequest<T> = {
        callbackInfo: callbackInfo,
        payload: payload,
      };

      const lambdaPayload: ICommunicationPayload = {
        httpMethod: httpMethod,
        path: path,
        body: callbackInfo ? queueBody : payload, // if callbackinfo is null, no need to wrap payload into IQueueRequest
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const message = new SendMessageCommand({
        QueueUrl: this.config.getQueue(queue),
        MessageBody: JSON.stringify(lambdaPayload),
      });

      this.logger.debug(
        `Inside ${this.sendMessage.name}. Sending message to queue: ${message.input.QueueUrl} with payload: ${message.input.MessageBody}`,
      );

      const data = await this.client.send(message);

      this.logger.debug(
        `Inside ${
          this.sendMessage.name
        }. Successfully added message to queue, response: ${JSON.stringify(data, null, ' ')}`,
      );

      return data.$metadata.httpStatusCode === HttpStatus.OK
        ? HttpStatus.ACCEPTED
        : HttpStatus.INTERNAL_SERVER_ERROR;
    } catch (error) {
      if (error.errno === -3001)
        throw new CommunicationException(
          `Failed to add message to queue: ${queue}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      throw error;
    }
  }

  public async enqueueCallbackMessage<T extends ICallbackMessage<unknown>>(
    callbackInfo: ICallbackInfo,
    httpMethod: HttpMethod = HttpMethod.Post,
    payload?: T,
  ): Promise<void> {
    await this.sendMessage(
      callbackInfo.callbackQueue,
      callbackInfo.callbackPath,
      httpMethod,
      null,
      payload,
    );
  }
}
