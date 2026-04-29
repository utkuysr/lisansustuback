import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { MustChangePasswordGuard } from './auth/guards/must-change-password.guard';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsModule } from './programs/programs.module';
import { ApplicationsModule } from './applications/applications.module';
import { DocumentsModule } from './documents/documents.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { DecisionModule } from './decision/decision.module';
import { UniversitiesModule } from './universities/universities.module';
import { FacultiesModule } from './faculties/faculties.module';
import { DepartmentsModule } from './departments/departments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StatsModule } from './stats/stats.module';
import { InstituteModule } from './institute/institute.module';
import { DataSource } from 'typeorm';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      useFactory: async () => {
        const url =
          process.env.DATABASE_URL ??
          'postgres://postgres:1234@localhost:5432/lisansustu';

        return {
          type: 'postgres' as const,
          url,
          autoLoadEntities: true,
          synchronize: false,
          ssl: url.includes('sslmode=require')
            ? { rejectUnauthorized: false }
            : undefined,
        };
      },
      dataSourceFactory: async (options) => {
        const ds = new DataSource({ ...(options as any), synchronize: false });
        await ds.initialize();
        await ds.query('CREATE SCHEMA IF NOT EXISTS belek_graduate_admission');
        await ds.synchronize();
        return ds;
      },
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    FacultiesModule,
    UniversitiesModule,
    DepartmentsModule,
    ProgramsModule,
    ApplicationsModule,
    DocumentsModule,
    DecisionModule,
    NotificationsModule,
    StatsModule,
    InstituteModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src', 'documents', 'Uploads'),
      serveRoot: '/documents',
      serveStaticOptions: {
        index: false,
      },
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: MustChangePasswordGuard },
  ],
})
export class AppModule {}
