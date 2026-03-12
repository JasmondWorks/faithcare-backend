export abstract class BaseService<T> {
  constructor(protected repository: any) {}

  create(data: Partial<T>) {
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

  update(id: string, data) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}
