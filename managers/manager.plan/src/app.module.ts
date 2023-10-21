import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpErrorFilter } from './core/modules/errors/error.service';
import { APP_FILTER } from '@nestjs/core';
import { CallbackController } from './controllers/callback.controller';
import { CommunicationModule } from './core/modules/communication/communication.module';
import { PlanController } from './controllers/plan.controller';
import { Configuration } from './config';

@Module({
  imports: [ConfigModule.forRoot(), CommunicationModule],
  controllers: [PlanController, CallbackController],
  providers: [
    Configuration,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
  ],
})
export class AppModule {}
