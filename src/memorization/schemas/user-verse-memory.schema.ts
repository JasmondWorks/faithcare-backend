import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from 'src/core/database/base.schema';

export type UserVerseMemoryDocument = UserVerseMemory & Document;

export enum MemoryStatus {
  LEARNING = 'learning',
  REVIEWING = 'reviewing',
  MASTERED = 'mastered',
  ARCHIVED = 'archived',
}

export enum ReviewGrade {
  PERFECT = 'perfect',
  HESITANT = 'hesitant',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class UserVerseMemory extends BaseSchema {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Verse', required: true })
  verseId: Types.ObjectId;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ type: String, enum: MemoryStatus, default: MemoryStatus.LEARNING })
  status: MemoryStatus;

  @Prop({ default: 1 })
  interval: number;

  @Prop({ default: 2.5 })
  easeFactor: number;

  @Prop({ type: Date, default: () => new Date() })
  nextReviewAt: Date;

  @Prop({ default: 0 })
  totalReps: number;

  @Prop({ default: 0 })
  streak: number;

  @Prop({
    type: String,
    enum: [...Object.values(ReviewGrade), null],
    default: null,
  })
  lastGrade: ReviewGrade | null;

  @Prop({ type: Date, default: null })
  masteredAt?: Date;

  @Prop({
    type: [
      {
        reviewedAt: { type: Date, required: true },
        grade: { type: String, required: true },
        intervalBefore: { type: Number, required: true },
        intervalAfter: { type: Number, required: true },
      },
    ],
    default: [],
  })
  reviewHistory: Array<{
    reviewedAt: Date;
    grade: string;
    intervalBefore: number;
    intervalAfter: number;
  }>;
}

export const UserVerseMemorySchema = SchemaFactory.createForClass(UserVerseMemory);
UserVerseMemorySchema.index({ userId: 1, organizationId: 1 });
UserVerseMemorySchema.index({ userId: 1, verseId: 1 }, { unique: true });
UserVerseMemorySchema.index({ nextReviewAt: 1, status: 1 });
