import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalFileService } from './medical-file.service';
import { MedicalFileController } from './medical-file.controller';
import { MedicalFile } from '../../database/entities/medical-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalFile])],
  controllers: [MedicalFileController],
  providers: [MedicalFileService],
  exports: [MedicalFileService],
})
export class MedicalFileModule {}
