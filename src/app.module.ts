import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
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
import { MessageTemplatesModule } from './modules/message-templates/message-templates.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminApplicationsModule } from './modules/admin-applications/admin-applications.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { MemorizationModule } from './memorization/memorization.module';
import { BibleReferenceModule } from './modules/bible-reference/bible-reference.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [envConfig] }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongodb.uri'),
        serverSelectionTimeoutMS: 30000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectionFactory: (connection) => {
          connection.plugin((schema: any) => {
            schema.set('toJSON', {
              virtuals: true,
              versionKey: false,
              transform: (doc: any, ret: any) => {
                delete ret._id;
              },
            });
            schema.set('toObject', {
              virtuals: true,
              versionKey: false,
              transform: (doc: any, ret: any) => {
                delete ret._id;
              },
            });
          });
          return connection;
        },
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
    MessageTemplatesModule,
    AdminApplicationsModule,
    WebhooksModule,
    MemorizationModule,
    BibleReferenceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule { }
