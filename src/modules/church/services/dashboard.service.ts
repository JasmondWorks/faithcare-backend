import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  FirstTimer,
  FirstTimerDocument,
} from 'src/modules/first-timers/schemas/first-timer.schema';
import { MessageLog, MessageLogDocument } from '../schemas/message-log.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(FirstTimer.name)
    private firstTimerModel: Model<FirstTimerDocument>,
    @InjectModel(MessageLog.name)
    private messageLogModel: Model<MessageLogDocument>,
  ) {}

  async getSummary(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const [
      totalFirstTimers,
      pendingFollowUps,
      contactedThisWeek,
      secondTimeVisitors,
      messagesSentToday,
    ] = await Promise.all([
      this.firstTimerModel.countDocuments({ organizationId, isDeleted: false }),
      this.firstTimerModel.countDocuments({
        organizationId,
        status: 'PENDING',
        isDeleted: false,
      }),
      this.firstTimerModel.countDocuments({
        organizationId,
        status: 'CONTACTED',
        updatedAt: { $gte: startOfWeek },
        isDeleted: false,
      }),
      this.firstTimerModel.countDocuments({
        organizationId,
        visitType: 'second_time',
        isDeleted: false,
      }),
      this.messageLogModel.countDocuments({
        organizationId,
        status: { $in: ['sent', 'delivered'] },
        createdAt: { $gte: today },
      }),
    ]);

    const contacted = totalFirstTimers - pendingFollowUps;
    const followUpRate =
      totalFirstTimers > 0
        ? Math.round((contacted / totalFirstTimers) * 1000) / 10
        : 0;

    return {
      totalFirstTimers,
      pendingFollowUps,
      contactedThisWeek,
      secondTimeVisitors,
      followUpRatePercent: followUpRate,
      messagesSentToday,
    };
  }

  async getWeeklyTrends(organizationId: string, weeks = 8) {
    const trends: {
      weekStart: string;
      newFirstTimers: number;
      contacted: number;
      pending: number;
    }[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (now.getDay() + 7 * i));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const [newFirstTimers, contacted, pending] = await Promise.all([
        this.firstTimerModel.countDocuments({
          organizationId,
          createdAt: { $gte: weekStart, $lt: weekEnd },
          isDeleted: false,
        }),
        this.firstTimerModel.countDocuments({
          organizationId,
          status: 'CONTACTED',
          updatedAt: { $gte: weekStart, $lt: weekEnd },
          isDeleted: false,
        }),
        this.firstTimerModel.countDocuments({
          organizationId,
          status: 'PENDING',
          createdAt: { $gte: weekStart, $lt: weekEnd },
          isDeleted: false,
        }),
      ]);

      trends.push({
        weekStart: weekStart.toISOString().split('T')[0],
        newFirstTimers,
        contacted,
        pending,
      });
    }

    return trends;
  }
}
