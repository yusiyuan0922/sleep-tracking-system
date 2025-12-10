import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';
import { Patient } from '../../database/entities/patient.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import { AdverseEvent } from '../../database/entities/adverse-event.entity';
import { MedicalFile } from '../../database/entities/medical-file.entity';
import { StageRecord } from '../../database/entities/stage-record.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import { User } from '../../database/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      ScaleRecord,
      ScaleConfig,
      MedicationRecord,
      ConcomitantMedication,
      AdverseEvent,
      MedicalFile,
      StageRecord,
      Hospital,
      Doctor,
      User,
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
