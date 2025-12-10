import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UploadModule } from './modules/upload/upload.module';
import { HospitalModule } from './modules/hospital/hospital.module';
import { DoctorModule } from './modules/doctor/doctor.module';
import { PatientModule } from './modules/patient/patient.module';
import { UserModule } from './modules/user/user.module';
import { ScaleModule } from './modules/scale/scale.module';
import { MedicationModule } from './modules/medication/medication.module';
import { AdverseEventModule } from './modules/adverse-event/adverse-event.module';
import { MedicalFileModule } from './modules/medical-file/medical-file.module';
import { StageRecordModule } from './modules/stage-record/stage-record.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { OperationLogModule } from './modules/operation-log/operation-log.module';
import { PushMessageModule } from './modules/push-message/push-message.module';
import { SystemConfigModule } from './modules/system-config/system-config.module';
import { ScheduleTasksModule } from './modules/schedule/schedule.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ExportModule } from './modules/export/export.module';

@Module({
  imports: [
    // 环境变量配置
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development', '.env'],
    }),

    // 数据库配置
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'sleep_tracking',
      entities: [__dirname + '/database/entities/**/*.entity{.ts,.js}', __dirname + '/entities/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
    }),

    // 定时任务配置
    ScheduleModule.forRoot(),

    AuthModule,

    AdminModule,

    UploadModule,

    HospitalModule,

    DoctorModule,

    PatientModule,

    UserModule,

    ScaleModule,

    MedicationModule,

    AdverseEventModule,

    MedicalFileModule,

    StageRecordModule,

    AuditLogModule,

    OperationLogModule,

    PushMessageModule,

    SystemConfigModule,

    ScheduleTasksModule,

    DashboardModule,

    ExportModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
