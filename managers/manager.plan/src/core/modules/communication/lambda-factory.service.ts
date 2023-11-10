import { Injectable } from '@nestjs/common';
import { Lambda } from '@aws-sdk/client-lambda';
import { Accessor, Configuration } from 'src/config';

interface ILambdaClient {
  lambda: Lambda;
  functionName: string;
}

@Injectable()
export class LambdaFactory {
  private lambdaInstance: Lambda;

  constructor(private config: Configuration) {}

  public getLambda(service: string): ILambdaClient {
    const { name: functionName, endpoint: endpoint } = this.config.getService(service);

    // for cloud
    if (!this.config.IsOffline) {
      this.lambdaInstance = this.lambdaInstance ?? new Lambda({});

      return {
        lambda: this.lambdaInstance,
        functionName: functionName,
      };
    }

    // for local development
    this.lambdaInstance = new Lambda({
      endpoint: endpoint,
    });

    return {
      lambda: this.lambdaInstance,
      functionName: functionName,
    };
  }
}
