import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/core/services/base.service';
import { MessageLogDocument } from '../schemas/message-log.schema';
import { MessageLogRepository } from '../repositories/message-log.repository';

@Injectable()
export class MessageLogService extends BaseService<MessageLogDocument> {
  constructor(private messageLogRepository: MessageLogRepository) {
    super(messageLogRepository);
  }

  async findByOrganization(organizationId: string) {
    return this.messageLogRepository.findByOrganization(organizationId);
  }

  async findByFirstTimer(firstTimerId: string) {
    return this.messageLogRepository.findByFirstTimer(firstTimerId);
  }
}
