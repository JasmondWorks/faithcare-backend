import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  WorkforceApplication,
  WorkforceApplicationDocument,
} from '../schemas/workforce-application.schema';

@Injectable()
export class WorkforceApplicationRepository extends BaseRepository<WorkforceApplicationDocument> {
  constructor(
    @InjectModel(WorkforceApplication.name)
    model: Model<WorkforceApplicationDocument>,
  ) {
    super(model);
  }
}
