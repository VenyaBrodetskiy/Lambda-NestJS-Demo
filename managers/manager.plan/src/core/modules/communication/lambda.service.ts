import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { LambdaFactory } from './lambda-factory.service';
import { InvokeCommandInput, InvokeCommandOutput } from '@aws-sdk/client-lambda';
import { CommunicationException } from './lambda.exception';
import { ICommunicationPayload } from './communication.interface';
import { Accessor } from 'src/config';
import { HttpMethod } from 'src/core/enums/httpmethod.enum';

@Injectable()
export class LambdaCommunicationService {
  private readonly logger = new Logger(LambdaCommunicationService.name);
  constructor(private lambdaFactory: LambdaFactory) {}

  public async invoke<TResponse>(
    accessor: Accessor,
    path: string,
    httpMethod: HttpMethod = HttpMethod.Get,
    payload?: object,
  ): Promise<TResponse> {
    try {
      const { lambda, functionName } = this.lambdaFactory.getLambda(accessor);

      const lambdaPayload: ICommunicationPayload = {
        httpMethod: httpMethod,
        path: path,
        body: payload ?? undefined,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const params: InvokeCommandInput = {
        FunctionName: functionName,
        Payload: JSON.stringify(lambdaPayload),
      };

      this.logger.debug(
        `Inside ${this.invoke.name}. Invoking function: ${params.FunctionName} with payload: ${params.Payload}`,
      );

      const response: InvokeCommandOutput = await lambda.invoke(params);
      const responsePayload = JSON.parse(Buffer.from(response.Payload).toString());

      if (responsePayload.statusCode >= HttpStatus.BAD_REQUEST) {
        throw new CommunicationException(
          JSON.parse(responsePayload.body),
          responsePayload.statusCode,
        );
      }

      this.logger.debug(
        `Inside ${this.invoke.name}. Lambda invoke response payload: ${JSON.stringify(
          responsePayload,
          null,
          ' ',
        )}`,
      );

      if (typeof responsePayload.body === 'string' && this.isJsonString(responsePayload.body)) {
        const result = JSON.parse(responsePayload.body) as TResponse;
        return result;
      }

      return responsePayload.body as TResponse;
    } catch (error) {
      if (error.errno === -3001)
        throw new CommunicationException(
          `Failed to invoke lambda: ${accessor}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      throw error;
    }
  }

  private isJsonString(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
}
