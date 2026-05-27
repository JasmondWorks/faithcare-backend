import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import {
  BibleChapterCache,
  BibleChapterCacheDocument,
  ParsedVerse,
} from '../schemas/bible-chapter-cache.schema';

@Injectable()
export class BibleContentService {
  private readonly logger = new Logger(BibleContentService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectModel(BibleChapterCache.name)
    private readonly cacheModel: Model<BibleChapterCacheDocument>,
  ) { }

  private get apiKey(): string {
    return this.config.get<string>('scripture.key') ?? '';
  }

  private get baseUrl(): string {
    let url = this.config.get<string>('scripture.url') ?? 'https://api.scripture.api.bible/v1';
    // The FaithCare dashboard provides 'https://rest.api.bible', but endpoints require '/v1'
    if (!url.endsWith('/v1')) {
      url += '/v1';
    }
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
        `Bible API Error: ${res.status} ${body}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
    return res.json() as Promise<T>;
  }

  // ── Bible / translation list ─────────────────────────────────────────────
  // The free api.bible plan does not allow GET /bibles (returns 403).
  // IDs and display names are configured via API_BIBLE_IDS / API_BIBLE_NAMES
  // in the .env file. Fetch individual bible details to verify they're reachable.

  async getAvailableBibles() {
    const ids: string[] = this.config.get<string[]>('scripture.bibleIds') ?? [];
    const names: string[] = this.config.get<string[]>('scripture.bibleNames') ?? [];

    if (!ids.length) {
      return [];
    }

    const results = await Promise.allSettled(
      ids.map((id) => this.apiFetch<{ data: any }>(`/bibles/${id}`)),
    );

    return results.map((r, i) => {
      if (r.status === 'fulfilled') {
        const b = r.value.data;
        return {
          id: b.id,
          name: b.nameLocal || b.name,
          abbreviation: b.abbreviationLocal || b.abbreviation,
          language: b.language?.nameLocal || b.language?.name,
        };
      }
      // Fallback to env-configured name if API fetch fails
      return {
        id: ids[i],
        name: names[i] ?? ids[i],
        abbreviation: names[i] ?? ids[i],
        language: 'English',
      };
    });
  }

  async getAvailableAudioBibles() {
    const ids: string[] = this.config.get<string[]>('scripture.bibleIds') ?? [];

    if (!ids.length) return [];

    // Fetch audio bibles linked to each text bible
    const results = await Promise.allSettled(
      ids.map((id) =>
        this.apiFetch<{ data: any[] }>(`/bibles/${id}/audio-bibles`),
      ),
    );

    return results
      .flatMap((r) =>
        r.status === 'fulfilled'
          ? r.value.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            dblId: b.dblId,
          }))
          : [],
      );
  }

  // ── Books & chapters (browsing) ──────────────────────────────────────────

  async getBooks(bibleId: string) {
    const result = await this.apiFetch<{ data: any[] }>(
      `/bibles/${bibleId}/books`,
    );
    return result.data.map((b) => ({
      id: b.id,
      name: b.name,
      nameLong: b.nameLong,
    }));
  }

  async getChaptersForBook(bibleId: string, bookId: string) {
    const result = await this.apiFetch<{ data: any[] }>(
      `/bibles/${bibleId}/books/${bookId}/chapters`,
    );
    return result.data
      .filter((c) => !c.id.endsWith('.intro'))
      .map((c) => ({ id: c.id, number: c.number, reference: c.reference }));
  }

  // ── Chapter content (with caching) ──────────────────────────────────────

  async getChapter(bibleId: string, chapterId: string) {
    const cached = await this.cacheModel
      .findOne({ bibleId, chapterId })
      .exec();
    if (cached) return cached;

    this.logger.log(`Fetching from api.bible: ${bibleId}/${chapterId}`);

    const result = await this.apiFetch<{ data: any }>(
      `/bibles/${bibleId}/chapters/${chapterId}` +
      `?content-type=html&include-notes=false&include-titles=true` +
      `&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=true`,
    );

    const chapter = result.data;
    const verses = this.parseHtml(chapter.content ?? '');

    return this.cacheModel.create({
      bibleId,
      chapterId,
      reference: chapter.reference,
      rawHtml: chapter.content ?? '',
      verses,
      verseCount: chapter.verseCount ?? verses.length,
      nextChapterId: chapter.next?.id ?? null,
      prevChapterId: chapter.previous?.id ?? null,
    });
  }

  async getTranslatedGlobalVerse(bibleId: string, reference: string) {
    try {
      const result = await this.apiFetch<{ data: any }>(
        `/bibles/${bibleId}/search?query=${encodeURIComponent(reference)}`,
      );

      const passages = result.data?.passages ?? [];
      if (!passages.length) return null;

      const passage = passages[0];
      const rawHtml = passage.content ?? '';
      const verses = this.parseHtml(rawHtml);
      const text = verses.length > 0
        ? verses.map(v => v.text).join(' ')
        : rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      return {
        reference: passage.reference,
        chapterId: passage.chapterId,
        text,
        version: bibleId,
      };
    } catch (e: any) {
      this.logger.warn(`Failed to translate global verse '${reference}' to ${bibleId}: ${e.message}`);
      return null;
    }
  }

  // ── Audio ────────────────────────────────────────────────────────────────

  async getAudioChapter(audioBibleId: string, chapterId: string) {
    const result = await this.apiFetch<{ data: any }>(
      `/audio-bibles/${audioBibleId}/chapters/${chapterId}`,
    );
    return {
      chapterId: result.data.id,
      reference: result.data.reference,
      audioUrl: result.data.resourceUrl ?? null,
      mimeType: result.data.mimeType ?? 'audio/mpeg',
    };
  }

  // ── HTML → structured verses ─────────────────────────────────────────────

  parseHtml(html: string): ParsedVerse[] {
    const verses: ParsedVerse[] = [];

    // Locate each verse opening span and record its position
    const openRe =
      /<span\s[^>]*?data-number="(\d+)"[^>]*?data-sid="([^"]+)"[^>]*?>/g;
    const closeRe = /<\/span>/g;

    const markers: Array<{
      pos: number;
      number: number;
      sid: string;
      afterClose: number;
    }> = [];

    let m: RegExpExecArray | null;
    while ((m = openRe.exec(html)) !== null) {
      closeRe.lastIndex = m.index + m[0].length;
      const close = closeRe.exec(html);
      if (!close) continue;
      markers.push({
        pos: m.index,
        number: parseInt(m[1]),
        sid: m[2],
        afterClose: close.index + close[0].length,
      });
    }

    for (let i = 0; i < markers.length; i++) {
      const textEnd = markers[i + 1]?.pos ?? html.length;
      const raw = html.slice(markers[i].afterClose, textEnd);
      const text = raw
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text) {
        verses.push({ number: markers[i].number, reference: markers[i].sid, text });
      }
    }

    return verses;
  }
}
