import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from 'src/core/repositories/base.repository';
import {
  BookmarkedVerse,
  BookmarkedVerseDocument,
} from '../schemas/bookmarked-verse.schema';

@Injectable()
export class BookmarkedVerseRepository extends BaseRepository<BookmarkedVerseDocument> {
  constructor(
    @InjectModel(BookmarkedVerse.name) model: Model<BookmarkedVerseDocument>,
  ) {
    super(model);
  }

  findByUser(userId: string) {
    return this.model
      .find({ userId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .exec();
  }

  findExisting(userId: string, verseReference: string, bibleId: string) {
    return this.model
      .findOne({ userId, verseReference, bibleId, isDeleted: { $ne: true } })
      .exec();
  }
}
