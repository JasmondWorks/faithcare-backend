import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './controllers/user.controller';
import { UsersService } from './services/user.service';
import { UsersRepository } from './repositories/user.repository';
import { User, UserSchema } from './schemas/user.schema';
import { UserMetaData, UserMetaDataSchema } from './schemas/user-metadata.schema';
import {
  OrganizationUserSettings,
  OrganizationUserSettingsSchema,
} from './schemas/organization-user-settings.schema';
import { UserMetaDataRepository } from './repositories/user-metadata.repository';
import { OrganizationUserSettingsRepository } from './repositories/organization-user-settings.repository';
import { UserMetaDataService } from './services/user-metadata.service';
import { OrganizationUserSettingsService } from './services/organization-user-settings.service';
import { UserMetaDataController } from './controllers/user-metadata.controller';
import { OrganizationUserSettingsController } from './controllers/organization-user-settings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserMetaData.name, schema: UserMetaDataSchema },
      { name: OrganizationUserSettings.name, schema: OrganizationUserSettingsSchema },
    ]),
  ],
  controllers: [UsersController, UserMetaDataController, OrganizationUserSettingsController],
  providers: [
    UsersService,
    UsersRepository,
    UserMetaDataService,
    UserMetaDataRepository,
    OrganizationUserSettingsService,
    OrganizationUserSettingsRepository,
  ],
  exports: [UsersService, UserMetaDataService, OrganizationUserSettingsService],
})
export class UsersModule {}
