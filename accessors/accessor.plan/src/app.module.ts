import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Configuration } from './config/configuration.service';
import { APP_FILTER } from '@nestjs/core';
import { PlanDbService } from './services/plandb.service';
import { PlanController } from './controllers/plan.controller';
import { HttpErrorFilter } from './core/modules/errors/error.service';
import { CommunicationModule } from './core/modules/communication';

@Module({
  imports: [ConfigModule.forRoot(), CommunicationModule],
  controllers: [PlanController],
  providers: [
    Configuration,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter,
    },
    PlanDbService,
  ],
})
export class AppModule {}
