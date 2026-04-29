import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecisionService } from './decision.service';
import { DecisionController } from './decision.controller';
import { Decision } from './entities/decision.entity';
import { Application } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Decision, User, Application, ProgramCommissioner]),
        NotificationsModule,
    ],
    controllers: [DecisionController],
    providers: [DecisionService],
})
export class DecisionModule {}
