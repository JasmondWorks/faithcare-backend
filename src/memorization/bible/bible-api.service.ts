import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Verse, VerseDocument } from '../schemas/verse.schema';

// Only public-domain translations are cached to avoid copyright issues.
const CACHEABLE_TRANSLATIONS = new Set(['KJV', 'ASV', 'WEB']);

const TRANSLATION_MAP: Record<string, string> = {
  KJV: 'de4e12af7f28f599-02',
  ASV: '06125adad2d5898a-01',
  WEB: '9879dbb7cfe39e4d-04',
};

@Injectable()
export class BibleApiService {
  private readonly logger = new Logger(BibleApiService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(Verse.name) private readonly verseModel: Model<VerseDocument>,
  ) {}

  private get apiKey(): string {
    return this.config.get<string>('scripture.key') ?? '';
  }

  private get baseUrl(): string {
    let url =
      this.config.get<string>('scripture.url') ??
      'https://api.scripture.api.bible/v1';
    if (!url.endsWith('/v1')) url += '/v1';
    return url;
  }

  private async apiFetch<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'api-key': this.apiKey },
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`api.bible ${res.status}: ${body}`);
      throw new HttpException(
        'Bible text service is temporarily unavailable. Try again shortly.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return res.json() as Promise<T>;
  }

  async fetchVerse(
    reference: string,
    translation: string,
    organizationId: string,
  ): Promise<{ text: string; reference: string; translation: string }> {
    const t = translation.toUpperCase();
    const shouldCache = CACHEABLE_TRANSLATIONS.has(t);

    if (shouldCache) {
      const cached = await this.verseModel
        .findOne({ reference, translation: t, isDeleted: { $ne: true } })
        .exec();
      if (cached) return { text: cached.text, reference: cached.reference, translation: t };
    }

    const bibleId = TRANSLATION_MAP[t];
    if (!bibleId) {
      throw new HttpException(
        `Translation "${translation}" is not supported. Use KJV, ASV, or WEB.`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const result = await this.apiFetch<{ data: any }>(
      `/bibles/${bibleId}/search?query=${encodeURIComponent(reference)}`,
    );

    const passages: any[] = result.data?.passages ?? [];
    if (!passages.length) {
      throw new HttpException(
        `Verse "${reference}" not found in ${t}.`,
        HttpStatus.NOT_FOUND,
      );
    }

    const passage = passages[0];
    const text = (passage.content ?? '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const resolvedRef: string = passage.reference ?? reference;

    if (shouldCache) {
      await this.verseModel.create({
        reference: resolvedRef,
        text,
        translation: t,
        organizationId: 'GLOBAL',
      }).catch(() => {
        // Swallow duplicate key errors on concurrent requests
      });
    }

    return { text, reference: resolvedRef, translation: t };
  }

  async findOrCreateVerse(
    reference: string,
    translation: string,
    organizationId: string,
  ): Promise<VerseDocument> {
    const t = translation.toUpperCase();
    const existing = await this.verseModel
      .findOne({ reference, translation: t, isDeleted: { $ne: true } })
      .exec();
    if (existing) return existing;

    const { text, reference: resolvedRef } = await this.fetchVerse(
      reference,
      translation,
      organizationId,
    );

    const doc = await this.verseModel
      .findOneAndUpdate(
        { reference: resolvedRef, translation: t },
        { $setOnInsert: { reference: resolvedRef, text, translation: t, organizationId: 'GLOBAL' } },
        { upsert: true, new: true },
      )
      .exec();

    return doc!;
  }
}
