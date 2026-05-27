import { getModelToken } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Verse } from '../schemas/verse.schema';
import { VerseCollection } from '../schemas/verse-collection.schema';

interface SeedVerse {
  reference: string;
  text: string;
}

interface SeedCollection {
  title: string;
  description: string;
  theme: string;
  verses: SeedVerse[];
}

const SEED_DATA: SeedCollection[] = [
  {
    title: 'Anxiety & Peace',
    description: 'Verses that bring God\'s peace into worry and anxious moments.',
    theme: 'anxiety',
    verses: [
      {
        reference: 'Philippians 4:6-7',
        text: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
      },
      {
        reference: 'John 14:27',
        text: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
      },
      {
        reference: 'Matthew 6:34',
        text: 'Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof.',
      },
      {
        reference: 'Isaiah 41:10',
        text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
      },
      {
        reference: '1 Peter 5:7',
        text: 'Casting all your care upon him; for he careth for you.',
      },
    ],
  },
  {
    title: 'Identity in Christ',
    description: 'Who you are because of what Christ has done.',
    theme: 'identity',
    verses: [
      {
        reference: '2 Corinthians 5:17',
        text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
      },
      {
        reference: 'Ephesians 2:10',
        text: 'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
      },
      {
        reference: 'Romans 8:1',
        text: 'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.',
      },
      {
        reference: 'Galatians 2:20',
        text: 'I am crucified with Christ: nevertheless I live; yet not I, but Christ liveth in me: and the life which I now live in the flesh I live by the faith of the Son of God, who loved me, and gave himself for me.',
      },
      {
        reference: '1 John 3:1',
        text: 'Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not.',
      },
    ],
  },
  {
    title: 'Faith & Trust',
    description: 'Anchors for believing God when circumstances are uncertain.',
    theme: 'faith',
    verses: [
      {
        reference: 'Hebrews 11:1',
        text: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
      },
      {
        reference: 'Proverbs 3:5-6',
        text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.',
      },
      {
        reference: 'Romans 10:17',
        text: 'So then faith cometh by hearing, and hearing by the word of God.',
      },
      {
        reference: 'Mark 11:24',
        text: 'Therefore I say unto you, What things soever ye desire, when ye pray, believe that ye receive them, and ye shall have them.',
      },
      {
        reference: 'James 1:6',
        text: 'But let him ask in faith, nothing wavering. For he that wavereth is like a wave of the sea driven with the wind and tossed.',
      },
    ],
  },
  {
    title: 'Strength & Courage',
    description: 'God\'s call to be bold and strong in every season.',
    theme: 'strength',
    verses: [
      {
        reference: 'Joshua 1:9',
        text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
      },
      {
        reference: 'Isaiah 40:31',
        text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
      },
      {
        reference: 'Philippians 4:13',
        text: 'I can do all things through Christ which strengtheneth me.',
      },
      {
        reference: 'Psalm 27:1',
        text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
      },
      {
        reference: '2 Timothy 1:7',
        text: 'For God hath not given us the spirit of fear; but of power, and of love, and of a sound mind.',
      },
    ],
  },
];

/**
 * Seeds global verse collections.
 *
 * Idempotent: checks by (title, isGlobal) before inserting.
 *
 * Usage from main.ts (one-shot bootstrap):
 *   const app = await NestFactory.createApplicationContext(AppModule);
 *   const conn = app.get<Connection>(getConnectionToken());
 *   const verseModel = conn.model(Verse.name);
 *   const collectionModel = conn.model(VerseCollection.name);
 *   await seedVerseCollections(verseModel, collectionModel);
 *   await app.close();
 *
 * Or call from a NestJS lifecycle hook for automatic seeding on startup.
 */
export async function seedVerseCollections(
  verseModel: Model<any>,
  collectionModel: Model<any>,
): Promise<void> {
  console.log('Seeding verse collections...');

  for (const collection of SEED_DATA) {
    const exists = await collectionModel
      .findOne({ title: collection.title, isGlobal: true })
      .exec();

    if (exists) {
      console.log(`  [skip] "${collection.title}" already exists`);
      continue;
    }

    // Upsert each verse (idempotent by reference + translation)
    const verseIds: string[] = [];
    for (const v of collection.verses) {
      const doc = await verseModel
        .findOneAndUpdate(
          { reference: v.reference, translation: 'KJV' },
          {
            $setOnInsert: {
              reference: v.reference,
              text: v.text,
              translation: 'KJV',
              organizationId: 'GLOBAL',
            },
          },
          { upsert: true, new: true },
        )
        .exec();
      verseIds.push(doc._id);
    }

    await collectionModel.create({
      title: collection.title,
      description: collection.description,
      theme: collection.theme,
      verseIds,
      organizationId: 'GLOBAL',
      isGlobal: true,
    });

    console.log(`  [done] "${collection.title}" seeded with ${verseIds.length} verses`);
  }

  console.log('Seeding complete.');
}
