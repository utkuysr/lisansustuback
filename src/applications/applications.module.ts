import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { Application } from './entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { Program } from 'src/programs/entities/program.entity';
import { University } from 'src/universities/entities/university.entity';
import { Department } from 'src/departments/entities/department.entity';
import { ApplicationDocument } from 'src/documents/entities/application-document.entity';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, User, Program, University, Department, ApplicationDocument, ProgramCommissioner]),
    NotificationsModule,
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
