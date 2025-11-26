import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdverseEventService } from './adverse-event.service';
import { AdverseEventController } from './adverse-event.controller';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { AeAttachment } from '../../database/entities/ae-attachment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdverseEvent, AeAttachment])],
  controllers: [AdverseEventController],
  providers: [AdverseEventService],
  exports: [AdverseEventService],
})
export class AdverseEventModule {}
