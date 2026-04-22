import { FilterQuery, Model, UpdateQuery } from 'mongoose';

export abstract class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: any): Promise<T> {
    const doc = new this.model(data);
    return (await doc.save()) as unknown as T;
  }

  async findAll(filter: FilterQuery<T> = {}): Promise<T[]> {
    const query = { ...filter, isDeleted: false } as FilterQuery<T>;
    return this.model.find(query).exec();
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    const query = { ...filter, isDeleted: false } as FilterQuery<T>;
    return this.model.findOne(query).exec();
  }

  async findById(id: string): Promise<T | null> {
    const query = { _id: id, isDeleted: false } as FilterQuery<T>;
    return this.model.findOne(query).exec();
  }

  async update(id: string, update: UpdateQuery<T>): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }

  async softDelete(id: string): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() } as UpdateQuery<T>,
        { new: true },
      )
      .exec();
  }

  async restore(id: string): Promise<T | null> {
    return this.model
      .findByIdAndUpdate(
        id,
        { isDeleted: false, deletedAt: null } as UpdateQuery<T>,
        { new: true },
      )
      .exec();
  }

  async paginate(
    filter: FilterQuery<T> = {},
    options: { page: number; limit: number },
  ): Promise<{
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;
    const query = { ...filter, isDeleted: false } as FilterQuery<T>;

    const [data, total] = await Promise.all([
      this.model.find(query).skip(skip).limit(limit).exec(),
      this.model.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
