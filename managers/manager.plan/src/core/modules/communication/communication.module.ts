import { Module } from '@nestjs/common';
import { LambdaFactory } from './lambda-factory.service';
import { LambdaCommunicationService } from './lambda.service';
import { SqsService } from './sqs.service';
import { Configuration } from 'src/config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [LambdaFactory, LambdaCommunicationService, SqsService, Configuration],
  exports: [LambdaCommunicationService, SqsService],
})
export class CommunicationModule {}
