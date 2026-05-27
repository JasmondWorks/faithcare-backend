import { Injectable } from '@nestjs/common';
import { MemoryStatus } from '../schemas/user-verse-memory.schema';

interface MemorySnapshot {
  interval: number;
  easeFactor: number;
  totalReps: number;
}

interface SrsResult {
  interval: number;
  easeFactor: number;
  nextReviewAt: Date;
  status: MemoryStatus;
}

@Injectable()
export class SrsService {
  calculateNextReview(
    memory: MemorySnapshot,
    grade: 'perfect' | 'hesitant' | 'failed',
  ): SrsResult {
    let { interval, easeFactor } = memory;
    const reps = memory.totalReps;

    if (grade === 'failed') {
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (grade === 'hesitant') {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 3;
      else if (reps === 2) interval = 10;
      else interval = Math.round(interval * 1.2);
      // easeFactor unchanged
    } else {
      // perfect
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 3;
      else if (reps === 2) interval = 10;
      else interval = Math.round(interval * easeFactor);
      easeFactor = Math.min(3.0, easeFactor + 0.1);
    }

    const nextReviewAt = new Date(Date.now() + interval * 24 * 60 * 60 * 1000);

    let status: MemoryStatus;
    if (grade === 'failed') {
      status = MemoryStatus.LEARNING;
    } else if (interval > 180) {
      status = MemoryStatus.MASTERED;
    } else if (reps >= 2) {
      status = MemoryStatus.REVIEWING;
    } else {
      status = MemoryStatus.LEARNING;
    }

    return { interval, easeFactor, nextReviewAt, status };
  }
}
