import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import {
  SalvationRecord,
  SalvationRecordSchema,
} from './schemas/salvation-record.schema';
import { Community, CommunitySchema } from './schemas/community.schema';
import {
  PrayerRequest,
  PrayerRequestSchema,
} from './schemas/prayer-request.schema';
import { FollowUp, FollowUpSchema } from './schemas/follow-up.schema';
import { Member, MemberSchema } from './schemas/member.schema';
import {
  FirstTimer,
  FirstTimerSchema,
} from 'src/modules/first-timers/schemas/first-timer.schema';
import { User, UserSchema } from 'src/modules/users/schemas/user.schema';
import { OrganizationRepository } from './repositories/organization.repository';
import { SalvationRecordRepository } from './repositories/salvation-record.repository';
import { CommunityRepository } from './repositories/community.repository';
import { PrayerRequestRepository } from './repositories/prayer-request.repository';
import { FollowUpRepository } from './repositories/follow-up.repository';
import { MemberRepository } from './repositories/member.repository';
import { OrganizationService } from './services/organization.service';
import { SalvationRecordService } from './services/salvation-record.service';
import { CommunityService } from './services/community.service';
import { PrayerRequestService } from './services/prayer-request.service';
import { FollowUpService } from './services/follow-up.service';
import { MemberService } from './services/member.service';
import { OrganizationController } from './controllers/organization.controller';
import { SalvationRecordController } from './controllers/salvation-record.controller';
import { CommunityController } from './controllers/community.controller';
import { PrayerRequestController } from './controllers/prayer-request.controller';
import { FollowUpController } from './controllers/follow-up.controller';
import { MemberController } from './controllers/member.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: SalvationRecord.name, schema: SalvationRecordSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: PrayerRequest.name, schema: PrayerRequestSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: Member.name, schema: MemberSchema },
      { name: FirstTimer.name, schema: FirstTimerSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    OrganizationController,
    SalvationRecordController,
    CommunityController,
    PrayerRequestController,
    FollowUpController,
    MemberController,
  ],
  providers: [
    OrganizationRepository,
    SalvationRecordRepository,
    CommunityRepository,
    PrayerRequestRepository,
    FollowUpRepository,
    MemberRepository,
    OrganizationService,
    SalvationRecordService,
    CommunityService,
    PrayerRequestService,
    FollowUpService,
    MemberService,
  ],
  exports: [
    OrganizationService,
    SalvationRecordService,
    CommunityService,
    PrayerRequestService,
    FollowUpService,
    MemberService,
  ],
})
export class OrganizationsModule {}
