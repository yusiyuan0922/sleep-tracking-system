import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Patient } from '../../database/entities/patient.entity';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, AdverseEvent, ScaleRecord, ScaleConfig]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
