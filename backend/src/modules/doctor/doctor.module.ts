import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';
import { Doctor } from '../../database/entities/doctor.entity';
import { User } from '../../database/entities/user.entity';
import { Hospital } from '../../database/entities/hospital.entity';
import { Patient } from '../../database/entities/patient.entity';
import { ScaleRecord } from '../../database/entities/scale-record.entity';
import { ScaleConfig } from '../../database/entities/scale-config.entity';
import { MedicalFile } from '../../database/entities/medical-file.entity';
import { MedicationRecord } from '../../database/entities/medication-record.entity';
import { ConcomitantMedication } from '../../database/entities/concomitant-medication.entity';
import { PushMessageModule } from '../push-message/push-message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Doctor,
      User,
      Hospital,
      Patient,
      ScaleRecord,
      ScaleConfig,
      MedicalFile,
      MedicationRecord,
      ConcomitantMedication,
    ]),
    PushMessageModule,
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
  exports: [DoctorService],
})
export class DoctorModule {}
