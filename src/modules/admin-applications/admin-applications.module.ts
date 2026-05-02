import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminApplication,
  AdminApplicationSchema,
} from './schemas/admin-application.schema';
import { User, UserSchema } from 'src/modules/users/schemas/user.schema';
import {
  Organization,
  OrganizationSchema,
} from 'src/modules/organizations/schemas/organization.schema';
import { AdminApplicationRepository } from './repositories/admin-application.repository';
import { AdminApplicationService } from './services/admin-application.service';
import { AdminApplicationSchedulerService } from './services/admin-application-scheduler.service';
import { AdminApplicationController } from './controllers/admin-application.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AdminApplication.name, schema: AdminApplicationSchema },
      { name: User.name, schema: UserSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [AdminApplicationController],
  providers: [
    AdminApplicationRepository,
    AdminApplicationService,
    AdminApplicationSchedulerService,
  ],
  exports: [AdminApplicationService],
})
export class AdminApplicationsModule {}
