import { Model, UpdateQuery } from 'mongoose';

export abstract class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: any): Promise<T> {
    const doc = new this.model(data);
    return (await doc.save()) as unknown as T;
  }

  async findAll(filter: any = {}): Promise<T[]> {
    return this.model.find({ ...filter, isDeleted: false }).exec();
  }

  async findOne(filter: any): Promise<T | null> {
    return this.model.findOne({ ...filter, isDeleted: false }).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findOne({ _id: id, isDeleted: false } as any).exec();
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
    filter: any = {},
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

    const [data, total] = await Promise.all([
      this.model
        .find({ ...filter, isDeleted: false })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.model.countDocuments({ ...filter, isDeleted: false }),
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
