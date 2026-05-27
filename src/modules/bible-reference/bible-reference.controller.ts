import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { BibleReferenceService } from './bible-reference.service';

@ApiTags('Scripture')
@ApiBearerAuth('access-token')
@Controller('bible/references')
export class BibleReferenceController {
  constructor(private readonly bibleReferenceService: BibleReferenceService) {}

  @Get()
  @ApiOperation({
    summary: 'Autocomplete Bible reference suggestions',
    description:
      'Returns up to 20 real Bible references matching the typed query. ' +
      'Intended for typeahead / search-as-you-type UI — call on each keystroke.\n\n' +
      '**Typing stages and what is returned:**\n' +
      '- `"gen"` → book names + chapter list (Genesis 1, Genesis 2 …)\n' +
      '- `"john 3"` → John 3 header + all 36 verses (John 3:1 … John 3:36)\n' +
      '- `"john 3:1"` → verses whose number starts with "1" (John 3:1, 3:10–3:19)\n' +
      '- `"john 3:16"` → exact match (John 3:16)\n\n' +
      '**Supported inputs:** full book names, common abbreviations (Gen, Jn, 1Cor, Rev…), ' +
      'partial names ("song of sol", "thess"), and numbered books without their prefix ("cor" → 1 & 2 Corinthians).',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    example: 'john 3:1',
    description: 'Partial Bible reference typed by the user (minimum 2 characters)',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of matching Bible reference suggestions',
    schema: {
      example: {
        success: true,
        data: [
          { reference: 'John 3:1',  book: 'John', chapter: 3, verse: 1  },
          { reference: 'John 3:10', book: 'John', chapter: 3, verse: 10 },
          { reference: 'John 3:16', book: 'John', chapter: 3, verse: 16 },
        ],
      },
    },
  })
  search(@Query('q') q: string) {
    if (!q || q.trim().length < 2) return [];
    return this.bibleReferenceService.search(q.trim());
  }
}
