import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import envConfig from './config/env.config';
import { RolesGuard } from './core/guards/roles.guard';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { CoreMessagingModule } from './core/core-messaging.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { FirstTimersModule } from './modules/first-timers/first-timers.module';
import { ChurchModule } from './modules/church/church.module';
import { JournalModule } from './modules/journal/journal.module';
import { DailyScriptureModule } from './modules/daily-scripture/daily-scripture.module';
import { FocusTimerModule } from './modules/focus-timer/focus-timer.module';
import { HealthModule } from './health/health.module';
import { PrimeModule } from './modules/prime/prime.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { MessageTemplatesModule } from './modules/message-templates/message-templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000,
      }),
    }),
    ScheduleModule.forRoot(),
    CoreMessagingModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    OrganizationsModule,
    FirstTimersModule,
    ChurchModule,
    JournalModule,
    DailyScriptureModule,
    FocusTimerModule,
    HealthModule,
    PrimeModule,
    FeedbackModule,
    MessageTemplatesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
