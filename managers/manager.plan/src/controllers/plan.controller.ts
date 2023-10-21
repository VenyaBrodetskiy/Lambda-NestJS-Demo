import { Controller, Get, Param, Post, HttpCode, HttpStatus, Body, Logger } from '@nestjs/common';

import { ICallbackInfo } from 'src/core/modules/communication';
import { LambdaCommunicationService, SqsService } from 'src/core/modules/communication';
import { Accessor, Queue } from 'src/config';
import { HttpMethod } from 'src/core/enums/httpmethod.enum';

import { PlanRes } from 'src/models/responses/plan.res';
import { PlanReq } from 'src/models/requests/plan.req';

@Controller('plan')
export class PlanController {
  private readonly logger = new Logger(PlanController.name);
  constructor(
    private readonly lambdaService: LambdaCommunicationService,
    private readonly sqsService: SqsService,
  ) {}

  @Get('/:id')
  public async getPlanById(@Param('id') id: string): Promise<PlanRes> {
    this.logger.log(`Inside ${this.getPlanById.name}, id: ${id}`);

    const result: PlanRes = await this.lambdaService.invoke<PlanRes>(
      Accessor.Plan,
      `/planaccessor/${id}`,
      HttpMethod.Get,
    );
    return result;
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  public async createPlan(@Body() plan: PlanReq): Promise<string> {
    this.logger.log(`Inside ${this.createPlan.name}, plan: ${JSON.stringify(plan)}`);

    const callbackInfo: ICallbackInfo = {
      callbackQueue: Queue.PlanManagerCallback,
      callbackPath: '/callback/plan',
      callerId: 'UserId', // TODO: here should be user identity, which is necessary to send notification via WS
      requestAction: {
        httpMethod: HttpMethod.Post,
        path: '/planaccessor',
      },
    };

    const result = await this.sqsService.sendMessage<PlanReq>(
      Queue.PlanAccessor,
      '/planaccessor',
      HttpMethod.Post,
      callbackInfo,
      plan,
    );

    return HttpStatus[result];
  }
}
