export interface BibleBook {
  name: string;
  normalizedName: string;
  nameWithoutNumber: string;
  abbrevs: string[];
  /** verse count per chapter, index = chapter - 1 */
  verses: number[];
}

export const BIBLE_BOOKS: BibleBook[] = [
  // ── Old Testament ─────────────────────────────────────────────────────────
  {
    name: 'Genesis', normalizedName: 'genesis', nameWithoutNumber: 'genesis',
    abbrevs: ['gen', 'ge', 'gn'],
    verses: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26],
  },
  {
    name: 'Exodus', normalizedName: 'exodus', nameWithoutNumber: 'exodus',
    abbrevs: ['exod', 'ex', 'exo'],
    verses: [22,25,22,31,23,30,25,32,43,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,27,38,38,36,43,38],
  },
  {
    name: 'Leviticus', normalizedName: 'leviticus', nameWithoutNumber: 'leviticus',
    abbrevs: ['lev', 'le', 'lv'],
    verses: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,37,27,24,33,44,23,55,46,34],
  },
  {
    name: 'Numbers', normalizedName: 'numbers', nameWithoutNumber: 'numbers',
    abbrevs: ['num', 'nu', 'nm'],
    verses: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13],
  },
  {
    name: 'Deuteronomy', normalizedName: 'deuteronomy', nameWithoutNumber: 'deuteronomy',
    abbrevs: ['deut', 'de', 'dt'],
    verses: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12],
  },
  {
    name: 'Joshua', normalizedName: 'joshua', nameWithoutNumber: 'joshua',
    abbrevs: ['josh', 'jos', 'jsh'],
    verses: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33],
  },
  {
    name: 'Judges', normalizedName: 'judges', nameWithoutNumber: 'judges',
    abbrevs: ['judg', 'jdg', 'jg'],
    verses: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25],
  },
  {
    name: 'Ruth', normalizedName: 'ruth', nameWithoutNumber: 'ruth',
    abbrevs: ['rth', 'ru'],
    verses: [22,23,18,22],
  },
  {
    name: '1 Samuel', normalizedName: '1 samuel', nameWithoutNumber: 'samuel',
    abbrevs: ['1sam', '1sa', '1sm'],
    verses: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13],
  },
  {
    name: '2 Samuel', normalizedName: '2 samuel', nameWithoutNumber: 'samuel',
    abbrevs: ['2sam', '2sa', '2sm'],
    verses: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25],
  },
  {
    name: '1 Kings', normalizedName: '1 kings', nameWithoutNumber: 'kings',
    abbrevs: ['1kgs', '1ki', '1kg'],
    verses: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53],
  },
  {
    name: '2 Kings', normalizedName: '2 kings', nameWithoutNumber: 'kings',
    abbrevs: ['2kgs', '2ki', '2kg'],
    verses: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30],
  },
  {
    name: '1 Chronicles', normalizedName: '1 chronicles', nameWithoutNumber: 'chronicles',
    abbrevs: ['1chr', '1ch', '1chron'],
    verses: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30],
  },
  {
    name: '2 Chronicles', normalizedName: '2 chronicles', nameWithoutNumber: 'chronicles',
    abbrevs: ['2chr', '2ch', '2chron'],
    verses: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23],
  },
  {
    name: 'Ezra', normalizedName: 'ezra', nameWithoutNumber: 'ezra',
    abbrevs: ['ezr'],
    verses: [11,70,13,24,17,22,28,36,15,44],
  },
  {
    name: 'Nehemiah', normalizedName: 'nehemiah', nameWithoutNumber: 'nehemiah',
    abbrevs: ['neh', 'ne'],
    verses: [11,20,32,23,19,19,73,18,38,39,36,47,31],
  },
  {
    name: 'Esther', normalizedName: 'esther', nameWithoutNumber: 'esther',
    abbrevs: ['esth', 'est', 'es'],
    verses: [22,23,15,17,14,14,10,17,32,3],
  },
  {
    name: 'Job', normalizedName: 'job', nameWithoutNumber: 'job',
    abbrevs: ['jb'],
    verses: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17],
  },
  {
    name: 'Psalms', normalizedName: 'psalms', nameWithoutNumber: 'psalms',
    abbrevs: ['ps', 'psa', 'psalm'],
    verses: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6],
  },
  {
    name: 'Proverbs', normalizedName: 'proverbs', nameWithoutNumber: 'proverbs',
    abbrevs: ['prov', 'pr', 'pro'],
    verses: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31],
  },
  {
    name: 'Ecclesiastes', normalizedName: 'ecclesiastes', nameWithoutNumber: 'ecclesiastes',
    abbrevs: ['eccl', 'ecc', 'ec', 'qoh'],
    verses: [18,26,22,16,20,12,29,17,18,20,10,14],
  },
  {
    name: 'Song of Solomon', normalizedName: 'song of solomon', nameWithoutNumber: 'song of solomon',
    abbrevs: ['song', 'ss', 'sos', 'cant'],
    verses: [17,17,11,16,16,13,13,14],
  },
  {
    name: 'Isaiah', normalizedName: 'isaiah', nameWithoutNumber: 'isaiah',
    abbrevs: ['isa', 'is'],
    verses: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,17,10,22,38,22,8,31,29,25,28,28,25,13,15,22,26,11,23,15,12,17,13,12,21,14,21,22,11,12,19,12,25,24],
  },
  {
    name: 'Jeremiah', normalizedName: 'jeremiah', nameWithoutNumber: 'jeremiah',
    abbrevs: ['jer', 'je'],
    verses: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,20,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34],
  },
  {
    name: 'Lamentations', normalizedName: 'lamentations', nameWithoutNumber: 'lamentations',
    abbrevs: ['lam', 'la'],
    verses: [22,22,66,22,22],
  },
  {
    name: 'Ezekiel', normalizedName: 'ezekiel', nameWithoutNumber: 'ezekiel',
    abbrevs: ['ezek', 'eze', 'ezk'],
    verses: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35],
  },
  {
    name: 'Daniel', normalizedName: 'daniel', nameWithoutNumber: 'daniel',
    abbrevs: ['dan', 'da', 'dn'],
    verses: [21,49,30,37,31,28,28,27,27,21,45,13],
  },
  {
    name: 'Hosea', normalizedName: 'hosea', nameWithoutNumber: 'hosea',
    abbrevs: ['hos', 'ho'],
    verses: [11,23,5,19,15,11,16,14,17,15,12,14,16,9],
  },
  {
    name: 'Joel', normalizedName: 'joel', nameWithoutNumber: 'joel',
    abbrevs: ['joe', 'jl'],
    verses: [20,32,21],
  },
  {
    name: 'Amos', normalizedName: 'amos', nameWithoutNumber: 'amos',
    abbrevs: ['am'],
    verses: [15,16,15,13,27,14,17,14,15],
  },
  {
    name: 'Obadiah', normalizedName: 'obadiah', nameWithoutNumber: 'obadiah',
    abbrevs: ['obad', 'ob'],
    verses: [21],
  },
  {
    name: 'Jonah', normalizedName: 'jonah', nameWithoutNumber: 'jonah',
    abbrevs: ['jon'],
    verses: [17,10,10,11],
  },
  {
    name: 'Micah', normalizedName: 'micah', nameWithoutNumber: 'micah',
    abbrevs: ['mic', 'mi'],
    verses: [16,13,12,13,15,16,20],
  },
  {
    name: 'Nahum', normalizedName: 'nahum', nameWithoutNumber: 'nahum',
    abbrevs: ['nah', 'na'],
    verses: [15,13,19],
  },
  {
    name: 'Habakkuk', normalizedName: 'habakkuk', nameWithoutNumber: 'habakkuk',
    abbrevs: ['hab', 'hb'],
    verses: [17,20,19],
  },
  {
    name: 'Zephaniah', normalizedName: 'zephaniah', nameWithoutNumber: 'zephaniah',
    abbrevs: ['zeph', 'zep', 'zp'],
    verses: [18,15,20],
  },
  {
    name: 'Haggai', normalizedName: 'haggai', nameWithoutNumber: 'haggai',
    abbrevs: ['hag', 'hg'],
    verses: [15,23],
  },
  {
    name: 'Zechariah', normalizedName: 'zechariah', nameWithoutNumber: 'zechariah',
    abbrevs: ['zech', 'zec', 'zc'],
    verses: [21,13,10,14,11,15,14,23,17,12,17,14,9,21],
  },
  {
    name: 'Malachi', normalizedName: 'malachi', nameWithoutNumber: 'malachi',
    abbrevs: ['mal', 'ml'],
    verses: [14,17,18,6],
  },

  // ── New Testament ─────────────────────────────────────────────────────────
  {
    name: 'Matthew', normalizedName: 'matthew', nameWithoutNumber: 'matthew',
    abbrevs: ['matt', 'mat', 'mt'],
    verses: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20],
  },
  {
    name: 'Mark', normalizedName: 'mark', nameWithoutNumber: 'mark',
    abbrevs: ['mar', 'mk', 'mr'],
    verses: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20],
  },
  {
    name: 'Luke', normalizedName: 'luke', nameWithoutNumber: 'luke',
    abbrevs: ['lk', 'lu'],
    verses: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53],
  },
  {
    name: 'John', normalizedName: 'john', nameWithoutNumber: 'john',
    abbrevs: ['jn', 'joh'],
    verses: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25],
  },
  {
    name: 'Acts', normalizedName: 'acts', nameWithoutNumber: 'acts',
    abbrevs: ['ac'],
    verses: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31],
  },
  {
    name: 'Romans', normalizedName: 'romans', nameWithoutNumber: 'romans',
    abbrevs: ['rom', 'ro', 'rm'],
    verses: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27],
  },
  {
    name: '1 Corinthians', normalizedName: '1 corinthians', nameWithoutNumber: 'corinthians',
    abbrevs: ['1cor', '1co'],
    verses: [31,16,23,21,13,20,40,13,27,33,34,31,13,40,58,24],
  },
  {
    name: '2 Corinthians', normalizedName: '2 corinthians', nameWithoutNumber: 'corinthians',
    abbrevs: ['2cor', '2co'],
    verses: [24,17,18,18,21,18,16,24,15,18,33,21,14],
  },
  {
    name: 'Galatians', normalizedName: 'galatians', nameWithoutNumber: 'galatians',
    abbrevs: ['gal', 'ga'],
    verses: [24,21,29,31,26,18],
  },
  {
    name: 'Ephesians', normalizedName: 'ephesians', nameWithoutNumber: 'ephesians',
    abbrevs: ['eph', 'ep'],
    verses: [23,22,21,32,33,24],
  },
  {
    name: 'Philippians', normalizedName: 'philippians', nameWithoutNumber: 'philippians',
    abbrevs: ['phil', 'php', 'pp'],
    verses: [30,30,21,23],
  },
  {
    name: 'Colossians', normalizedName: 'colossians', nameWithoutNumber: 'colossians',
    abbrevs: ['col'],
    verses: [29,23,25,18],
  },
  {
    name: '1 Thessalonians', normalizedName: '1 thessalonians', nameWithoutNumber: 'thessalonians',
    abbrevs: ['1thess', '1thes', '1th'],
    verses: [10,20,13,18,28],
  },
  {
    name: '2 Thessalonians', normalizedName: '2 thessalonians', nameWithoutNumber: 'thessalonians',
    abbrevs: ['2thess', '2thes', '2th'],
    verses: [12,17,18],
  },
  {
    name: '1 Timothy', normalizedName: '1 timothy', nameWithoutNumber: 'timothy',
    abbrevs: ['1tim', '1ti'],
    verses: [20,15,16,16,25,21],
  },
  {
    name: '2 Timothy', normalizedName: '2 timothy', nameWithoutNumber: 'timothy',
    abbrevs: ['2tim', '2ti'],
    verses: [18,26,17,22],
  },
  {
    name: 'Titus', normalizedName: 'titus', nameWithoutNumber: 'titus',
    abbrevs: ['tit'],
    verses: [16,15,15],
  },
  {
    name: 'Philemon', normalizedName: 'philemon', nameWithoutNumber: 'philemon',
    abbrevs: ['phlm', 'phm'],
    verses: [25],
  },
  {
    name: 'Hebrews', normalizedName: 'hebrews', nameWithoutNumber: 'hebrews',
    abbrevs: ['heb', 'he'],
    verses: [14,18,19,16,14,20,28,13,28,39,40,29,25],
  },
  {
    name: 'James', normalizedName: 'james', nameWithoutNumber: 'james',
    abbrevs: ['jas', 'jm', 'jam'],
    verses: [27,26,18,17,20],
  },
  {
    name: '1 Peter', normalizedName: '1 peter', nameWithoutNumber: 'peter',
    abbrevs: ['1pet', '1pe', '1pt'],
    verses: [25,25,22,19,14],
  },
  {
    name: '2 Peter', normalizedName: '2 peter', nameWithoutNumber: 'peter',
    abbrevs: ['2pet', '2pe', '2pt'],
    verses: [21,22,18],
  },
  {
    name: '1 John', normalizedName: '1 john', nameWithoutNumber: 'john',
    abbrevs: ['1jn', '1jo'],
    verses: [10,29,24,21,21],
  },
  {
    name: '2 John', normalizedName: '2 john', nameWithoutNumber: 'john',
    abbrevs: ['2jn', '2jo'],
    verses: [13],
  },
  {
    name: '3 John', normalizedName: '3 john', nameWithoutNumber: 'john',
    abbrevs: ['3jn', '3jo'],
    verses: [15],
  },
  {
    name: 'Jude', normalizedName: 'jude', nameWithoutNumber: 'jude',
    abbrevs: ['jud'],
    verses: [25],
  },
  {
    name: 'Revelation', normalizedName: 'revelation', nameWithoutNumber: 'revelation',
    abbrevs: ['rev', 're', 'rv'],
    verses: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,24,54,21,15,27,21],
  },
];
