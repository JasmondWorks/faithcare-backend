import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MemorizationService } from '../memorization.service';

@Injectable()
export class MemorizationScheduler {
  private readonly logger = new Logger(MemorizationScheduler.name);

  constructor(
    private readonly memorizationService: MemorizationService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Daily review reminders at 8 AM server time.
   *
   * Finds every user with at least one verse due today who hasn't reviewed yet.
   * Emits a `memorization.reminder.due` event per user — the events listener
   * (or a dedicated notifications handler) handles the actual delivery so this
   * scheduler stays free of channel-specific dependencies.
   */
  @Cron('0 8 * * *')
  async sendDailyReviewReminders() {
    this.logger.log('Running daily review reminder job');

    try {
      const today = new Date().toISOString().slice(0, 10);

      const dueByUser = await this.memorizationService.getDueCountsPerUser();
      if (!dueByUser.length) return;

      for (const { userId, organizationId, count } of dueByUser) {
        const alreadyReviewed = await this.memorizationService['logModel']
          ?.findOne({ userId, date: today, versesReviewed: { $gt: 0 } })
          .exec()
          .catch(() => null);

        if (alreadyReviewed) continue;

        this.eventEmitter.emit('memorization.reminder.due', {
          userId,
          organizationId,
          dueCount: count,
        });
      }
    } catch (err: any) {
      this.logger.error(`Review reminder job failed: ${err.message}`);
    }
  }

  /**
   * Midnight log finalization.
   *
   * DailyMemorizationLog records are updated in real time via upsertDailyLog,
   * so no aggregation is required here. This hook is a safe place to add future
   * end-of-day processing (e.g., sending weekly digest, pruning stale data).
   */
  @Cron('0 0 * * *')
  async aggregateDailyLogs() {
    this.logger.log('Daily memorization log finalization complete');
  }
}
