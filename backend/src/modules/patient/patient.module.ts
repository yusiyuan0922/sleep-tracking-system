import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';
import { Patient } from '../../database/entities/patient.entity';
import { User } from '../../database/entities/user.entity';
import { Doctor } from '../../database/entities/doctor.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { MedicalFile } from '../../database/entities/medical-file.entity';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import { PushMessageModule } from '../push-message/push-message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Patient,
      User,
      Doctor,
      Hospital,
      ScaleRecord,
      ScaleConfig,
      MedicalFile,
      MedicationRecord,
      ConcomitantMedication,
    ]),
    PushMessageModule,
  ],
  controllers: [PatientController],
  providers: [PatientService],
  exports: [PatientService],
})
export class PatientModule {}
