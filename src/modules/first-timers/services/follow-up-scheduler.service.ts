import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FirstTimerRepository } from '../repositories/first-timer.repository';

@Injectable()
export class FollowUpSchedulerService {
  private readonly logger = new Logger(FollowUpSchedulerService.name);

  constructor(
    private readonly firstTimerRepository: FirstTimerRepository,
    private readonly notifications: NotificationsService,
  ) {}

  // Runs every hour — finds first-timers whose follow-up is due and notifies org admins
  @Cron('0 * * * *')
  async checkDueFollowUps(): Promise<void> {
    const due = await this.firstTimerRepository.findDueFollowUps();
    if (!due.length) return;

    this.logger.log(`${due.length} follow-up(s) due`);

    for (const record of due) {
      const orgId = String((record as any).organizationId ?? '');
      if (orgId) {
        this.notifications.notifyFollowUpDue(orgId, {
          id: String((record as any)._id),
          name: (record as any).name,
          phoneNumber: (record as any).phoneNumber,
          visitType: (record as any).visitType,
          followUpScheduledAt: (record as any).followUpScheduledAt,
          organizationId: orgId,
        });
      }
    }
  }
}
