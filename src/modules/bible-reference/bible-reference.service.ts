import { Injectable } from '@nestjs/common';
import { BIBLE_BOOKS, BibleBook } from './bible-books.data';

export interface BibleSuggestion {
  reference: string;
  book: string;
  chapter?: number;
  verse?: number;
}

interface ParsedQuery {
  bookQ: string;
  chapter?: number;
  /** raw verse string for prefix matching — may be empty after a colon */
  verseStr?: string;
}

@Injectable()
export class BibleReferenceService {
  search(raw: string, limit = 20): BibleSuggestion[] {
    const q = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (q.length < 2) return [];

    const { bookQ, chapter, verseStr } = this.parseQuery(q);
    const books = this.findBooks(bookQ);
    if (!books.length) return [];

    // No chapter typed → suggest book names and their chapters
    if (chapter === undefined) {
      const results: BibleSuggestion[] = [];
      for (const book of books) {
        results.push({ reference: book.name, book: book.name });
        for (let c = 1; c <= book.verses.length; c++) {
          results.push({ reference: `${book.name} ${c}`, book: book.name, chapter: c });
          if (results.length >= limit) break;
        }
        if (results.length >= limit) break;
      }
      return results.slice(0, limit);
    }

    // Chapter typed — use the single best-matching book
    const book = books[0];
    if (chapter < 1 || chapter > book.verses.length) return [];
    const verseCount = book.verses[chapter - 1];

    // Chapter typed with colon but no verse yet (or still typing verse)
    if (verseStr !== undefined) {
      const results: BibleSuggestion[] = [];
      for (let v = 1; v <= verseCount; v++) {
        if (String(v).startsWith(verseStr)) {
          results.push({
            reference: `${book.name} ${chapter}:${v}`,
            book: book.name,
            chapter,
            verse: v,
          });
        }
        if (results.length >= limit) break;
      }
      return results;
    }

    // Chapter typed, no colon → suggest the chapter + all its verses
    const results: BibleSuggestion[] = [
      { reference: `${book.name} ${chapter}`, book: book.name, chapter },
    ];
    for (let v = 1; v <= verseCount && results.length < limit; v++) {
      results.push({
        reference: `${book.name} ${chapter}:${v}`,
        book: book.name,
        chapter,
        verse: v,
      });
    }
    return results;
  }

  private parseQuery(q: string): ParsedQuery {
    // "john 3:16" or "john 3:" (colon with no verse yet)
    const colonMatch = q.match(/^(.*?)\s+(\d+):(\d*)$/);
    if (colonMatch) {
      return {
        bookQ: colonMatch[1].trim(),
        chapter: parseInt(colonMatch[2], 10),
        verseStr: colonMatch[3], // empty string = colon typed, verse not yet
      };
    }

    // "john 3" or "1 cor 13"
    const chapterMatch = q.match(/^(.*?)\s+(\d+)$/);
    if (chapterMatch && chapterMatch[1].trim().length > 0) {
      return {
        bookQ: chapterMatch[1].trim(),
        chapter: parseInt(chapterMatch[2], 10),
      };
    }

    // Just a book name fragment: "gen", "1 cor", "song of sol"
    return { bookQ: q };
  }

  private findBooks(bookQ: string): BibleBook[] {
    const q = bookQ.toLowerCase().trim();
    const qNoSpace = q.replace(/\s+/g, '');

    return BIBLE_BOOKS.filter((book) => {
      if (book.normalizedName.startsWith(q)) return true;
      if (book.normalizedName.replace(/\s/g, '').startsWith(qNoSpace)) return true;
      if (book.nameWithoutNumber.startsWith(q)) return true;
      if (book.abbrevs.some((a) => a.startsWith(q) || a.startsWith(qNoSpace))) return true;
      return false;
    });
  }
}
