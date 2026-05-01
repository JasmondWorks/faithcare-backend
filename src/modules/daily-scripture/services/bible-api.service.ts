import { Injectable, Logger } from '@nestjs/common';

interface VerseResult {
  reference: string;
  text: string;
  version: string;
}

@Injectable()
export class BibleApiService {
  private readonly logger = new Logger(BibleApiService.name);

  async fetchVerseOfTheDay(): Promise<VerseResult | null> {
    try {
      const res = await fetch(
        'https://beta.ourmanna.com/api/v1/get/?format=json&order=daily',
      );
      if (!res.ok) {
        this.logger.warn(`Bible API returned ${res.status}`);
        return null;
      }

      const data = (await res.json()) as {
        verse?: {
          details?: { text?: string; reference?: string; version?: string };
        };
      };

      const details = data?.verse?.details;
      if (!details?.text || !details?.reference) {
        this.logger.warn('Bible API response missing required fields');
        return null;
      }

      return {
        reference: details.reference,
        text: details.text.trim(),
        version: details.version ?? 'KJV',
      };
    } catch (err) {
      this.logger.error(`Bible API fetch failed: ${String(err)}`);
      return null;
    }
  }
}
