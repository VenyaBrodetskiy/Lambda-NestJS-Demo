import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

import { Configuration } from 'src/config/configuration.service';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { IPlan } from 'src/models/plan.dto';

@Injectable()
export class PlanDbService {
  private readonly dynamoDB: DynamoDBDocumentClient;
  private readonly logger = new Logger(PlanDbService.name);

  constructor(private readonly config: Configuration) {
    // TODO: here it's possible to create dynamodbProvider which will ensure singletone behaviour of dynamoDb client
    // as long as we have just 1 service for communication with db, it doesn't matter
    const client: DynamoDBClient = new DynamoDBClient({
      region: config.DBRegion,
      endpoint: config.DynamoEndpoint,
    });
    this.dynamoDB = DynamoDBDocumentClient.from(client);
  }

  public async getPlanById(id: string): Promise<IPlan> {
    const command: GetCommand = new GetCommand({
      TableName: this.config.PlanTable,
      Key: {
        planId: id,
      },
    });
    try {
      this.logger.log(`Inside ${this.getPlanById.name}, id: ${id}`);

      const result = await this.dynamoDB.send(command);
      return result.Item as IPlan;
    } catch (error) {
      this.logger.error(`${error.message} in ${this.getPlanById.name} for id: ${id}`);
      throw error;
    }
  }

  public async createPlan(plan: IPlan): Promise<string> {
    const command: PutCommand = new PutCommand({
      TableName: this.config.PlanTable,
      Item: plan,
    });

    try {
      await this.dynamoDB.send(command);

      this.logger.log(`Inside ${this.createPlan.name}, Plan with id: "${plan.planId}" created`);

      return plan.planId;
    } catch (error) {
      this.logger.error(`${error.message} in ${this.createPlan.name} for id: ${plan.planId}`);
      throw error;
    }
  }
}
