import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdminApplicationService } from './admin-application.service';

@Injectable()
export class AdminApplicationSchedulerService {
  private readonly logger = new Logger(AdminApplicationSchedulerService.name);

  constructor(private readonly appService: AdminApplicationService) {}

  @Cron('0 0 * * *')
  async purgeExpiredApplications(): Promise<void> {
    const count = await this.appService.purgeExpired();
    if (count > 0) {
      this.logger.log(
        `Purged ${count} expired admin application(s) and associated accounts`,
      );
    }
  }
}
