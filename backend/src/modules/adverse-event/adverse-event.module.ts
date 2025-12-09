import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdverseEventService } from './adverse-event.service';
import { AdverseEventController } from './adverse-event.controller';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { AeAttachment } from '../../database/entities/ae-attachment.entity';
import { Patient } from '../../database/entities/patient.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import { User } from '../../database/entities/user.entity';
import { PushMessageModule } from '../push-message/push-message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdverseEvent, AeAttachment, Patient, Doctor, User]),
    PushMessageModule,
  ],
  controllers: [AdverseEventController],
  providers: [AdverseEventService],
  exports: [AdverseEventService],
})
export class AdverseEventModule {}
