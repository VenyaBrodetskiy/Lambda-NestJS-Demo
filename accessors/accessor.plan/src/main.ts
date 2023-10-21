import { NestFactory } from '@nestjs/core';
import serverless, { Handler } from 'serverless-http';
import { AppModule } from './app.module';
import { LogLevel } from '@nestjs/common';
import { Context, SQSEvent } from 'aws-lambda';
import { ICommunicationPayload } from './core/modules/communication';

let server: Handler;

async function bootstrap(): Promise<Handler> {
  const isDev: boolean = Boolean(process.env.IS_OFFLINE);
  const logLevels: LogLevel[] = isDev
    ? ['error', 'warn', 'log', 'verbose', 'debug']
    : ['error', 'warn', 'log', 'debug'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

export const handler: Handler = async (
  event: ICommunicationPayload | SQSEvent,
  context: Context,
) => {
  server = server ?? (await bootstrap());

  let sqsEvent: ICommunicationPayload;
  if (isSqsEvent(event)) {
    sqsEvent = transformSqsToHttp(event);
  }

  return server(sqsEvent ?? event, context);
};

function isSqsEvent(event: ICommunicationPayload | SQSEvent): event is SQSEvent {
  return 'Records' in event && event.Records[0] && event.Records[0].eventSource === 'aws:sqs';
}

function transformSqsToHttp(event: SQSEvent): ICommunicationPayload {
  const payload: ICommunicationPayload = JSON.parse(event.Records[0].body);

  return {
    httpMethod: payload.httpMethod,
    path: payload.path,
    body: payload.body,
    headers: payload.headers ?? {
      'Content-Type': 'application/json',
    },
  };
}
