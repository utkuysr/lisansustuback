import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RankingsService } from './rankings.service';
import { RankingsController } from './rankings.controller';
import { ProgramRanking } from './entities/program-ranking.entity';
import { Application } from 'src/applications/entities/application.entity';
import { Program } from 'src/programs/entities/program.entity';
import { Decision } from 'src/decision/entities/decision.entity';
import { ProgramCommissioner } from 'src/programs/entities/program-commissioner.entity';
import { InstituteManager } from 'src/institute-managers/entities/institute-manager.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProgramRanking, Application, Program, Decision, ProgramCommissioner, InstituteManager]),
    NotificationsModule,
    AuthModule,
  ],
  controllers: [RankingsController],
  providers: [RankingsService],
  exports: [RankingsService],
})
export class RankingsModule {}
