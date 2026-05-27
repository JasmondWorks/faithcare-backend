import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MemorizationService } from './memorization.service';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { AddVerseDto } from './dto/add-verse.dto';
import { SearchVerseDto } from './dto/search-verse.dto';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';

@ApiTags('Memorization')
@ApiBearerAuth('access-token')
@Controller('memorization')
export class MemorizationController {
  constructor(private readonly memorizationService: MemorizationService) {}

  // ── Queue ──────────────────────────────────────────────────────────────────

  @Get('queue')
  @ApiOperation({
    summary: "Get today's due review queue",
    description:
      'Returns verses due for review with auto-generated practice challenges ' +
      'based on spaced-repetition schedule. Default limit 10, max 20.',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getDueQueue(
    @CurrentUser() user: RequestUser,
    @Query('limit') limit?: string,
  ) {
    return this.memorizationService.getDueQueue(
      user.id,
      user.organizationId!,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────

  @Post('review')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit a review result',
    description:
      'Records the grade and advances the SRS schedule. ' +
      'Accepts an optional reviewedAt for offline sync (within last 7 days).',
  })
  submitReview(
    @Body() dto: SubmitReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.memorizationService.submitReview(user.id, user.organizationId!, dto);
  }

  // ── Add / Remove ──────────────────────────────────────────────────────────

  @Post('add')
  @ApiOperation({
    summary: 'Add a verse to the learning queue',
    description:
      'Pass an existing verseId, or a reference + translation to fetch and cache from api.bible. ' +
      'Returns the existing entry if the verse is already in the queue.',
  })
  @ApiResponse({ status: 201 })
  addVerse(@Body() dto: AddVerseDto, @CurrentUser() user: RequestUser) {
    return this.memorizationService.addVerse(user.id, user.organizationId!, dto);
  }

  @Delete('remove/:verseId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a verse from the queue',
    description: 'Soft-archives the entry. Re-adding the verse will restore it.',
  })
  removeVerse(
    @Param('verseId') verseId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.memorizationService.removeVerse(user.id, verseId);
  }

  // ── Progress ──────────────────────────────────────────────────────────────

  @Get('progress')
  @ApiOperation({
    summary: "Get the authenticated user's memorization progress",
    description:
      'Returns totals by status, current streak, 365-day heatmap, and top mastered verses.',
  })
  getProgress(@CurrentUser() user: RequestUser) {
    return this.memorizationService.getProgress(user.id, user.organizationId!);
  }

  // ── Collections ───────────────────────────────────────────────────────────

  @Get('collections')
  @ApiOperation({
    summary: 'List available verse collections',
    description: 'Returns global curated packs and organisation-specific collections.',
  })
  @ApiQuery({ name: 'theme', required: false })
  getCollections(
    @CurrentUser() user: RequestUser,
    @Query('theme') theme?: string,
  ) {
    return this.memorizationService.getCollections(user.organizationId!, theme);
  }

  @Post('collections/:collectionId/enqueue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Add all verses in a collection to the learning queue',
  })
  enqueueCollection(
    @Param('collectionId') collectionId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.memorizationService.enqueueCollection(
      user.id,
      user.organizationId!,
      collectionId,
    );
  }

  // ── Verse search ──────────────────────────────────────────────────────────

  @Get('verse/search')
  @ApiOperation({
    summary: 'Search / fetch a verse by reference from api.bible',
    description:
      'Returns the verse text from cache or fetches it live. ' +
      'Only KJV, ASV, and WEB are supported (public domain).',
  })
  @ApiQuery({ name: 'reference', required: true })
  @ApiQuery({ name: 'translation', required: false, enum: ['KJV', 'ASV', 'WEB'] })
  searchVerse(
    @Query() dto: SearchVerseDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.memorizationService.searchVerse(user.organizationId!, dto);
  }

  // ── Group stats ───────────────────────────────────────────────────────────

  @Get('stats/group/:groupId')
  @ApiOperation({
    summary: 'Collective group memorization stats',
    description:
      'Aggregated stats only — no individual breakdown returned. ' +
      'Includes total verses memorized, weekly reviews, and collective streak.',
  })
  getGroupStats(
    @Param('groupId') groupId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.memorizationService.getGroupStats(groupId, user.organizationId!);
  }
}
