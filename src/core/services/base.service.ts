export abstract class BaseService<_T> {
  constructor(protected repository: any) {}

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

  update(id: string, data: any) {
    return this.repository.update(id, data);
  }

  delete(id: string) {
    return this.repository.delete(id);
  }
}
