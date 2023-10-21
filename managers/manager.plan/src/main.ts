import { NestFactory } from '@nestjs/core';
import serverless, { Handler } from 'serverless-http';
import { AppModule } from './app.module';
import { LogLevel, ValidationPipe } from '@nestjs/common';
import { ReplaySubject, firstValueFrom } from 'rxjs';
import { Context, SQSEvent } from 'aws-lambda';
import { ICommunicationPayload } from './core/modules/communication/communication.interface';

const serverSubject = new ReplaySubject<Handler>();

async function bootstrap(): Promise<Handler> {
  const isDev: boolean = Boolean(process.env.IS_OFFLINE);
  const logLevels: LogLevel[] = isDev
    ? ['error', 'warn', 'log', 'verbose', 'debug']
    : ['error', 'warn', 'log', 'debug'];

  const app = await NestFactory.create(AppModule, {
    logger: logLevels,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  if (isDev) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');

    const options = new DocumentBuilder()
      .setTitle('Manager.Plan')
      .setVersion('1.0')
      .setDescription('Swagger for manager of plan')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('api', app, document);
  }

  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverless(expressApp);
}

bootstrap().then((server) => serverSubject.next(server));

export const handler: Handler = async (
  event: ICommunicationPayload | SQSEvent,
  context: Context,
) => {
  const server = await firstValueFrom(serverSubject);

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
