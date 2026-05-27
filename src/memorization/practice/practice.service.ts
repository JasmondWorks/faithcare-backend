import { Injectable } from '@nestjs/common';

type FirstLetterChallenge = {
  mode: 'first-letter';
  words: string[];
  prompt: string[];
  reference: string;
};

type ClozeChallenge = {
  mode: 'cloze';
  segments: Array<{ type: 'word' | 'blank'; value: string; index: number }>;
  reference: string;
  blankCount: number;
};

type FullRecallChallenge = {
  mode: 'full-recall';
  reference: string;
  wordCount: number;
};

export type PracticeChallenge =
  | FirstLetterChallenge
  | ClozeChallenge
  | FullRecallChallenge;

@Injectable()
export class PracticeService {
  generateFirstLetterChallenge(
    verseText: string,
    reference: string,
  ): FirstLetterChallenge {
    const words = verseText.split(/\s+/).filter(Boolean);
    const prompt = words.map((w) => w[0] ?? '');
    return { mode: 'first-letter', words, prompt, reference };
  }

  generateClozeChallenge(
    verseText: string,
    reference: string,
    repNumber: number,
    userId: string,
    verseId: string,
  ): ClozeChallenge {
    const words = verseText.split(/\s+/).filter(Boolean);

    let blankPercent: number;
    if (repNumber <= 2) blankPercent = 0.2;
    else if (repNumber <= 4) blankPercent = 0.4;
    else if (repNumber <= 6) blankPercent = 0.6;
    else blankPercent = 0.8;

    const eligible = words
      .map((w, i) => ({ w, i }))
      .filter(({ w, i }) => w.length > 3 && i > 0 && i < words.length - 1);

    const targetBlanks = Math.round(eligible.length * blankPercent);
    const seed = this.hashSeed(userId + verseId);
    const shuffled = this.seededShuffle(eligible, seed);
    const toBlank = new Set(shuffled.slice(0, targetBlanks).map((e) => e.i));

    const segments = words.map((value, index) => ({
      type: (toBlank.has(index) ? 'blank' : 'word') as 'word' | 'blank',
      value,
      index,
    }));

    return { mode: 'cloze', segments, reference, blankCount: toBlank.size };
  }

  generateFullRecallChallenge(
    verseText: string,
    reference: string,
  ): FullRecallChallenge {
    const wordCount = verseText.split(/\s+/).filter(Boolean).length;
    return { mode: 'full-recall', reference, wordCount };
  }

  getModeForRep(repNumber: number): 'cloze' | 'first-letter' | 'full-recall' {
    if (repNumber === 1) return 'cloze';
    if (repNumber === 2) return 'first-letter';
    if (repNumber === 3) return 'cloze';
    if (repNumber === 4) return 'full-recall';
    return repNumber % 2 === 1 ? 'first-letter' : 'full-recall';
  }

  buildChallenge(
    verseText: string,
    reference: string,
    repNumber: number,
    userId: string,
    verseId: string,
  ): PracticeChallenge {
    const mode = this.getModeForRep(repNumber);
    switch (mode) {
      case 'first-letter':
        return this.generateFirstLetterChallenge(verseText, reference);
      case 'cloze':
        return this.generateClozeChallenge(
          verseText,
          reference,
          repNumber,
          userId,
          verseId,
        );
      default:
        return this.generateFullRecallChallenge(verseText, reference);
    }
  }

  private hashSeed(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash * 31) + str.charCodeAt(i)) >>> 0;
    }
    return hash;
  }

  private seededShuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    let s = seed;
    for (let i = result.length - 1; i > 0; i--) {
      s = ((s * 1664525) + 1013904223) >>> 0;
      const j = s % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
