import { Module } from '@nestjs/common';
import { SqsService } from './sqs.service';
import { ConfigModule } from '@nestjs/config';
import { Configuration } from 'src/config';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [SqsService, Configuration],
  exports: [SqsService],
})
export class CommunicationModule {}
