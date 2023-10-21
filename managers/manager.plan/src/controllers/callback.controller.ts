import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ICallbackMessage } from 'src/core/modules/communication';

@Controller('callback')
export class CallbackController {
  private readonly logger: Logger = new Logger(CallbackController.name);
  constructor() {}

  @Post('plan')
  public async PlanCallback(@Body() callback: ICallbackMessage<unknown>): Promise<void> {
    try {
      this.logger.debug(
        `Inside ${this.PlanCallback.name}, callback: ${JSON.stringify(callback, null, ' ')}`,
      );

      // TODO: send notification through websocket to frontend
    } catch (error) {
      throw error;
    }
  }
}
