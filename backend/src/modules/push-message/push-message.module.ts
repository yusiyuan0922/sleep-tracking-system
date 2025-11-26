import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushMessage } from '../../database/entities/push-message.entity';
import { PushMessageService } from './push-message.service';
import { PushMessageController } from './push-message.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PushMessage])],
  controllers: [PushMessageController],
  providers: [PushMessageService],
  exports: [PushMessageService],
})
export class PushMessageModule {}
