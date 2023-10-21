import { Controller, HttpStatus, Logger, Param } from '@nestjs/common';
import { PlanDbService } from 'src/services/plandb.service';
import { Get, Post, HttpCode, Body } from '@nestjs/common';
import { HttpMethod } from 'src/core/enums';
import { SqsService, IQueueRequest, ICallbackMessage } from 'src/core/modules/communication';
import { IPlan } from 'src/models/plan.dto';
import { IPlanReq } from 'src/models/requests/plan.req';
import { randomUUID } from 'crypto';

@Controller('planaccessor')
export class PlanController {
  private readonly logger = new Logger(PlanController.name);

  constructor(
    private readonly planDbService: PlanDbService,
    private readonly sqsService: SqsService,
  ) {}

  @Get('/:id')
  public async getPlanById(@Param('id') id: string): Promise<IPlan> {
    try {
      this.logger.log(`Inside ${this.getPlanById.name}, id: ${id}`);
      return await this.planDbService.getPlanById(id);
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async createPlan(@Body() planQueueReq: IQueueRequest<IPlanReq>): Promise<void> {
    this.logger.log(`Inside ${this.createPlan.name}, plan: ${JSON.stringify(planQueueReq)}`);

    const { payload: planReq, callbackInfo } = planQueueReq;

    const callbackMessage: ICallbackMessage<string> = {
      isSuccessful: false,
      resultMessage: 'Failed to create new plan',
      callerId: callbackInfo.callerId,
      requestAction: callbackInfo.requestAction,
    };

    try {
      const plan: IPlan = {
        ...planReq,
        planId: randomUUID(),
        schemaVersion: '1.0.0',
        creationDate: new Date().toUTCString(),
        lastModified: new Date().toUTCString(),
      };

      const result = await this.planDbService.createPlan(plan);

      callbackMessage.isSuccessful = result ? true : false;
      callbackMessage.resultMessage = 'Created new plan';
      callbackMessage.result = result;
    } catch (error) {
      throw error;
    } finally {
      await this.sqsService.enqueueCallbackMessage(callbackInfo, HttpMethod.Post, callbackMessage);
    }
  }
}
