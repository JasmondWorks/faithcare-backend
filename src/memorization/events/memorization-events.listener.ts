import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { VerseMasteredEvent } from '../memorization.service';

interface ReminderEvent {
  userId: string;
  organizationId: string;
  dueCount: number;
}

@Injectable()
export class MemorizationEventsListener {
  private readonly logger = new Logger(MemorizationEventsListener.name);

  /**
   * Fires when a user's verse transitions to `mastered` status (interval > 180 days).
   *
   * Extend this handler to trigger push notifications, award badges, or update
   * leaderboards. No blocking work should happen here — emit further events or
   * enqueue background jobs.
   */
  @OnEvent('verse.mastered')
  handleVerseMastered(payload: VerseMasteredEvent) {
    this.logger.log(
      `User ${payload.userId} mastered verse "${payload.reference}" (org: ${payload.organizationId})`,
    );
  }

  /**
   * Fires once per user from the 8 AM scheduler when they have due verses.
   *
   * To send actual notifications, inject MessagingService or a push-notification
   * client here and look up the user's preferred contact channel from their
   * profile. The `dueCount` and template string are ready to use.
   *
   * Example template:
   *   "You have {{count}} verse{{s}} due for review today.
   *    Open the app to maintain your streak! 📖"
   */
  @OnEvent('memorization.reminder.due')
  handleReviewReminder(payload: ReminderEvent) {
    const s = payload.dueCount === 1 ? '' : 's';
    this.logger.log(
      `Reminder pending for user ${payload.userId}: ` +
      `${payload.dueCount} verse${s} due (org: ${payload.organizationId})`,
    );
  }
}
