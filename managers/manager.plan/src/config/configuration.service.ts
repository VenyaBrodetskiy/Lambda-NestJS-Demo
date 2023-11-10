import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Accessor } from './accessors.enum';
import { Queue } from './queues.enum';

interface IAcccessorConfig {
  name: string;
  endpoint: string;
}

@Injectable()
export class Configuration {
  constructor(private configService: ConfigService) {
    this.validateConfig();
  }

  get IsOffline(): boolean {
    return Boolean(this.configService.get<boolean>('IS_OFFLINE'));
  }

  get SqsEndpoint(): string {
    return this.configService.get<string>('SQS_ENDPOINT');
  }

  public getQueue(queue: Queue): string {
    try {
      switch (queue) {
        case Queue.PlanAccessor:
          return this.configService.getOrThrow<string>('PLAN_ACCESSOR_QUEUE');
        case Queue.PlanManagerCallback:
          return this.configService.getOrThrow<string>('PLAN_MANAGER_CALLBACK_QUEUE');
        default:
          throw new Error(`Unknown queue type. Configuration.service misses queue: ${queue}`);
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  public getService(service: string): IAcccessorConfig {
    try {
      switch (service) {
        case Accessor.Plan:
          return {
            name: this.configService.getOrThrow<string>('PLANACCESSOR_NAME'),
            endpoint: this.configService.getOrThrow<string>('PLANACCESSOR_ENDPOINT'),
          };
        // case Accessor.OtherAccessor:
        //   return {
        //     name: this.configService.getOrThrow<string>('NOTIFICATIONACCESSOR_NAME'),
        //     endpoint: this.configService.getOrThrow<string>('NOTIFICATIONACCESSOR_ENDPOINT'),
        //   };
        default:
          throw new Error(
            `Unknown accessor type. Configuration.service misses accessor: ${service}`,
          );
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  private validateConfig(): void {
    // when running application, this function checks that developer didn't forget to add necessary configs to configuration.service (mostly for enums)

    // Validate accessor configurations
    for (const accessor of Object.values(Accessor)) {
      this.getService(accessor as Accessor);
    }

    // Validate queue configuration not missed
    for (const queue of Object.values(Queue)) {
      this.getQueue(queue as Queue);
    }
  }
}
