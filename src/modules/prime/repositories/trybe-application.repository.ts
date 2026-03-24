import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  TrybeApplication,
  TrybeApplicationDocument,
} from '../schemas/trybe-application.schema';

@Injectable()
export class TrybeApplicationRepository extends BaseRepository<TrybeApplicationDocument> {
  constructor(
    @InjectModel(TrybeApplication.name)
    model: Model<TrybeApplicationDocument>,
  ) {
    super(model);
  }
}
