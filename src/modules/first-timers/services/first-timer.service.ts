import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { FirstTimerDocument } from '../schemas/first-timer.schema';
import { FirstTimerRepository } from '../repositories/first-timer.repository';

@Injectable()
export class FirstTimerService extends BaseService<FirstTimerDocument> {
  constructor(
    private firstTimerRepository: FirstTimerRepository,
    private notifications: NotificationsService,
  ) {
    super(firstTimerRepository);
  }

  async create(data: any): Promise<FirstTimerDocument> {
    const record = await super.create(data);
    const orgId = String((record as any).organizationId ?? '');
    if (orgId) {
      this.notifications.notifyNewFirstTimer(orgId, {
        id: String((record as any)._id),
        name: (record as any).name,
        visitType: (record as any).visitType,
        organizationId: orgId,
      });
    }
    return record;
  }

  async findByOrganization(
    organizationId: string,
    filters?: { status?: string; visitType?: string },
  ) {
    return this.firstTimerRepository.findByOrganization(organizationId, filters);
  }

  async findDueFollowUps() {
    return this.firstTimerRepository.findDueFollowUps();
  }
}
