import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Application } from 'src/applications/entities/application.entity';
import { User } from 'src/users/entities/user.entity';
import { Program } from 'src/programs/entities/program.entity';
import { Decision } from 'src/decision/entities/decision.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application, User, Program, Decision])],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
