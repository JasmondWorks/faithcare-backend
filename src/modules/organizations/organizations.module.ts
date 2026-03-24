import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Organization, OrganizationSchema } from './schemas/organization.schema';
import { Membership, MembershipSchema } from './schemas/membership.schema';
import { SalvationRecord, SalvationRecordSchema } from './schemas/salvation-record.schema';
import { Community, CommunitySchema } from './schemas/community.schema';
import { PrayerRequest, PrayerRequestSchema } from './schemas/prayer-request.schema';
import { FollowUp, FollowUpSchema } from './schemas/follow-up.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { OrganizationRepository } from './repositories/organization.repository';
import { MembershipRepository } from './repositories/membership.repository';
import { SalvationRecordRepository } from './repositories/salvation-record.repository';
import { CommunityRepository } from './repositories/community.repository';
import { PrayerRequestRepository } from './repositories/prayer-request.repository';
import { FollowUpRepository } from './repositories/follow-up.repository';
import { OrganizationService } from './services/organization.service';
import { MembershipService } from './services/membership.service';
import { SalvationRecordService } from './services/salvation-record.service';
import { CommunityService } from './services/community.service';
import { PrayerRequestService } from './services/prayer-request.service';
import { FollowUpService } from './services/follow-up.service';
import { OrganizationController } from './controllers/organization.controller';
import { MembershipController } from './controllers/membership.controller';
import { SalvationRecordController } from './controllers/salvation-record.controller';
import { CommunityController } from './controllers/community.controller';
import { PrayerRequestController } from './controllers/prayer-request.controller';
import { FollowUpController } from './controllers/follow-up.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Membership.name, schema: MembershipSchema },
      { name: User.name, schema: UserSchema },
      { name: SalvationRecord.name, schema: SalvationRecordSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: PrayerRequest.name, schema: PrayerRequestSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
    ]),
  ],
  controllers: [
    OrganizationController,
    MembershipController,
    SalvationRecordController,
    CommunityController,
    PrayerRequestController,
    FollowUpController,
  ],
  providers: [
    OrganizationRepository,
    MembershipRepository,
    SalvationRecordRepository,
    CommunityRepository,
    PrayerRequestRepository,
    FollowUpRepository,
    OrganizationService,
    MembershipService,
    SalvationRecordService,
    CommunityService,
    PrayerRequestService,
    FollowUpService,
  ],
  exports: [
    MembershipService,
    OrganizationService,
    SalvationRecordService,
    CommunityService,
    PrayerRequestService,
    FollowUpService,
  ],
})
export class OrganizationsModule {}
