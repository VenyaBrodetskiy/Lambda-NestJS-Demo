import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from './queues.enum';

@Injectable()
export class Configuration {
  constructor(private configService: ConfigService) {
    this.validateConfig();
  }

  get IsOffline(): boolean {
    return Boolean(this.configService.get('IS_OFFLINE'));
  }

  get DynamoEndpoint(): string {
    return this.configService.getOrThrow('DYNAMODB_ENDPOINT');
  }

  get PlanTable(): string {
    return this.configService.getOrThrow('DYNAMODB_TABLE_PLANS');
  }

  get DBRegion(): string {
    return this.configService.getOrThrow('DYNAMODB_ENDPOINT_REGION');
  }

  get SqsEndpoint(): string {
    return this.configService.get<string>('SQS_ENDPOINT');
  }

  public getQueue(queue: Queue): string {
    try {
      switch (queue) {
        case Queue.PlanManagerCallback:
          return this.configService.getOrThrow<string>('PLAN_MANAGER_CALLBACK_QUEUE');
        default:
          throw new Error(`Unknown queue type. Configuration.service misses queue: ${queue}`);
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  private validateConfig(): void {
    // when running application, this function checks that developer didn't forget to add necessary configs to configuration.service (mostly for enums)

    // Validate queue configuration not missed
    for (const queue of Object.values(Queue)) {
      this.getQueue(queue as Queue);
    }
  }
}
