import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { LambdaFactory } from './lambda-factory.service';
import { InvokeCommandInput } from '@aws-sdk/client-lambda';
import { CommunicationException } from './lambda.exception';
import { ICommunicationPayload } from './communication.interface';
import { HttpMethod } from 'src/core/enums/httpmethod.enum';
import retry from 'async-retry';

@Injectable()
export class LambdaCommunicationService {
  private readonly logger = new Logger(LambdaCommunicationService.name);
  constructor(private lambdaFactory: LambdaFactory) {}

  /**
   * Invokes a Lambda function with the specified parameters.
   *
   * @param service  Identifier to locate the lambda function.
   * @param path  Path associated with the request.
   * @param httpMethod  HTTP method for the request (default is GET).
   * @param payload  The payload object to be passed to the lambda.
   *
   * @param retries  Number of retries to be attempted on failure.
   *                 IMPORTANT: Retry will only be performed for GET and DELETE requests.
   *                 For other HTTP methods, this value will be ignored.
   *                 Note: The default number of retries (if retries are applicable) is 3.
   *
   * @returns  Returns a Promise that resolves with the type TResponse.
   *
   * @throws  LambdaCommunicationException if the invoked Lambda function
   *          returns a status code indicating a bad request or higher.
   */
  public async invoke<TResponse>(
    service: string,
    path: string,
    httpMethod: HttpMethod = HttpMethod.Get,
    payload?: object,
    retries: number = 3,
  ): Promise<TResponse> {
    try {
      const { lambda, functionName } = this.lambdaFactory.getLambda(service);

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

      // enable retries only for GET and DELETE requests
      let effectiveRetries;
      if (httpMethod === HttpMethod.Get || httpMethod === HttpMethod.Delete) {
        effectiveRetries = retries;
      } else {
        effectiveRetries = 0;
      }

      let responsePayload;
      await retry(
        async () => {
          this.logger.debug(
            `Inside ${this.invoke.name}. Invoking function: ${params.FunctionName} with payload: ${params.Payload}`,
          );

          const response = await lambda.invoke(params);
          responsePayload = JSON.parse(Buffer.from(response.Payload).toString());

          if (responsePayload.statusCode >= HttpStatus.BAD_REQUEST) {
            throw new CommunicationException(
              JSON.parse(responsePayload.body),
              responsePayload.statusCode,
            );
          }
        },
        {
          retries: effectiveRetries,
          onRetry: (error) => {
            error &&
              this.logger.warn(`Error while calling lambda: ${params.FunctionName} with payload: ${
                params.Payload
              }, retrying...
              Error: ${JSON.stringify(error, null, ' ')}`);
          },
        },
      );

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
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED')
        throw new CommunicationException(
          `Failed to invoke lambda: ${service}`,
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
