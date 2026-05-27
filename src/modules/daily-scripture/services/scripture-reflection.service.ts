import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import type Anthropic from '@anthropic-ai/sdk';
import {
  PassageReflection,
  PassageReflectionDocument,
} from '../schemas/passage-reflection.schema';
import { ParsedVerse } from '../schemas/bible-chapter-cache.schema';

@Injectable()
export class ScriptureReflectionService {
  private readonly logger = new Logger(ScriptureReflectionService.name);
  private client: Anthropic | null = null;

  constructor(
    private readonly config: ConfigService,
    @InjectModel(PassageReflection.name)
    private readonly reflectionModel: Model<PassageReflectionDocument>,
  ) {}

  private async getClient(): Promise<Anthropic> {
    if (!this.client) {
      const { default: AnthropicClass } = await import('@anthropic-ai/sdk');
      this.client = new AnthropicClass({
        apiKey: this.config.get<string>('anthropic.apiKey') ?? '',
      });
    }
    return this.client;
  }

  /**
   * Returns the reflection for a chapter.
   * Checks the cache first; generates with Claude if not found.
   * Reflections are chapter-level (not translation-specific) and cached forever.
   */
  async getOrGenerate(
    chapterId: string,
    reference: string,
    verses: ParsedVerse[],
  ): Promise<PassageReflectionDocument> {
    const cached = await this.reflectionModel.findOne({ chapterId }).exec();
    if (cached) return cached;

    this.logger.log(`Generating reflection for ${reference}`);
    const passageText = verses.map((v) => `${v.number}. ${v.text}`).join('\n');

    const prompt = `You are a thoughtful pastor helping believers engage with the Bible for personal devotion. Given the following Bible passage, generate a brief devotional resource.

Reference: ${reference}
Passage:
${passageText}

Respond ONLY with valid JSON in exactly this structure (no extra text, no markdown fences):
{
  "theme": "2-4 word theme name",
  "context": "Two sentences of historical or literary background that help the reader understand this passage.",
  "reflectionQuestions": [
    "Question 1 — probing personal application",
    "Question 2 — connecting to God's character",
    "Question 3 — a call to action or prayer"
  ],
  "prayerPrompt": "A 1-2 sentence prayer starter that flows naturally from this passage.",
  "application": "One concrete, practical action the reader can take today based on this passage.",
  "memoryVerse": {
    "reference": "Book Chapter:Verse",
    "text": "The exact verse text"
  }
}`;

    try {
      const client = await this.getClient();
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw =
        message.content[0].type === 'text' ? message.content[0].text : '';

      const parsed = JSON.parse(raw);

      return this.reflectionModel.create({
        chapterId,
        theme: parsed.theme,
        context: parsed.context,
        reflectionQuestions: parsed.reflectionQuestions,
        prayerPrompt: parsed.prayerPrompt,
        application: parsed.application,
        memoryVerse: parsed.memoryVerse,
      });
    } catch (err) {
      this.logger.error(`Reflection generation failed for ${chapterId}: ${String(err)}`);
      // Return a safe fallback so the app doesn't break if Claude is unavailable
      return this.reflectionModel.create({
        chapterId,
        theme: 'Daily Reading',
        context: `Read and meditate on ${reference}.`,
        reflectionQuestions: [
          'What does this passage reveal about God?',
          'What is God asking of you through these words?',
          'How can you apply this passage to your life today?',
        ],
        prayerPrompt: 'Lord, open my heart to receive what You have for me in Your Word today.',
        application: 'Choose one verse from this passage to carry with you throughout the day.',
        memoryVerse: verses[0]
          ? { reference: verses[0].reference, text: verses[0].text }
          : { reference, text: '' },
      });
    }
  }
}
