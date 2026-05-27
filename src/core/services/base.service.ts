import { UpdateQuery } from 'mongoose';
import { BaseRepository } from '../repositories/base.repository';

export abstract class BaseService<T> {
  constructor(protected repository: BaseRepository<T>) {}

  create(data: any) {
    return this.repository.create(data);
  }

  findAll(filter = {}) {
    return this.repository.findAll(filter);
  }

  findOne(filter = {}) {
    return this.repository.findOne(filter);
  }

  findById(id: string) {
    return this.repository.findById(id);
  }

  update(id: string, data: UpdateQuery<T>) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }

  softDelete(id: string) {
    return this.repository.softDelete(id);
  }

  paginate(
    filter: any = {},
    options: { page: number; limit: number; sort?: Record<string, 1 | -1> },
  ) {
    return this.repository.paginate(filter, options);
  }
}
