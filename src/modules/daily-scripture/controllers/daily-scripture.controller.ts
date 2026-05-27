import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsMongoId, IsOptional, IsString, MinLength } from 'class-validator';
import { DailyScriptureService } from '../services/daily-scripture.service';
import { DailyScriptureSchedulerService } from '../services/daily-scripture-scheduler.service';
import { BibleContentService } from '../services/bible-content.service';
import { ReadingPlanService } from '../services/reading-plan.service';
import { BookmarkedVerseRepository } from '../repositories/bookmarked-verse.repository';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { RequestUser } from 'src/core/types/request-user.interface';
import { Roles } from 'src/core/decorators/roles.decorator';
import { Role } from 'src/core/enums/role.enum';
import { PaginationDto } from 'src/core/dto/pagination.dto';

class ResumePlanDto {
  @ApiProperty({ description: 'The `id` of the UserReadingPlan record to resume (from GET /scripture/plans/mine/all)' })
  @IsMongoId()
  userPlanId: string;
}

class SubscribePlanDto {
  @ApiProperty({ description: 'ReadingPlan _id' })
  @IsMongoId()
  planId: string;

  @ApiProperty({ description: 'api.bible translation ID (e.g. KJV bibleId)' })
  @IsString()
  translationId: string;
}

class BookmarkVerseDto {
  @ApiProperty() @IsString() bibleId: string;
  @ApiProperty() @IsString() chapterId: string;
  @ApiProperty() @IsString() verseReference: string;
  @ApiProperty() @IsString() verseText: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}

class UpdateNotesDto {
  @ApiProperty() @IsString() @MinLength(1) notes: string;
}

@ApiTags('Scripture')
@ApiBearerAuth('access-token')
@Controller('scripture')
export class DailyScriptureController {
  constructor(
    private readonly scriptureService: DailyScriptureService,
    private readonly schedulerService: DailyScriptureSchedulerService,
    private readonly bibleContent: BibleContentService,
    private readonly readingPlans: ReadingPlanService,
    private readonly bookmarkRepo: BookmarkedVerseRepository,
  ) {}

  // ── Global verse (public cached verse) ──────────────────────────────────

  @Get('global/today')
  @ApiOperation({
    summary: "Today's global verse of the day (shared for all users)",
    description:
      'Auto-fetched once daily. Returns the cached result on subsequent calls.',
  })
  getTodayGlobalVerse() {
    return this.schedulerService.fetchTodayOrTrigger();
  }

  @Post('global/fetch')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger a global verse fetch (ADMIN only)' })
  async triggerFetch() {
    await this.schedulerService.fetchAndStoreDailyVerse();
    return this.schedulerService.fetchTodayOrTrigger();
  }

  // ── Available translations ───────────────────────────────────────────────

  @Get('bibles')
  @ApiOperation({
    summary: "List available Bible translations",
    description:
      'Returns all translations enabled on the api.bible account (e.g. NIV, KJV, NLT). ' +
      'Use the `id` field as `translationId` when subscribing to a reading plan.',
  })
  getAvailableBibles() {
    return this.bibleContent.getAvailableBibles();
  }

  @Get('bibles/audio')
  @ApiOperation({ summary: 'List available audio Bible versions' })
  getAudioBibles() {
    return this.bibleContent.getAvailableAudioBibles();
  }

  // ── Bible browsing ───────────────────────────────────────────────────────

  @Get('bibles/:bibleId/books')
  @ApiOperation({ summary: 'List all books in a translation' })
  getBooks(@Param('bibleId') bibleId: string) {
    return this.bibleContent.getBooks(bibleId);
  }

  @Get('bibles/:bibleId/books/:bookId/chapters')
  @ApiOperation({ summary: 'List all chapters in a book' })
  getChapters(
    @Param('bibleId') bibleId: string,
    @Param('bookId') bookId: string,
  ) {
    return this.bibleContent.getChaptersForBook(bibleId, bookId);
  }

  @Get('bibles/:bibleId/chapters/:chapterId')
  @ApiOperation({
    summary: 'Get a chapter — full text, structured verses, and AI reflection',
    description:
      'Fetches the chapter from api.bible (cached after first load) and generates a ' +
      'Claude-powered devotional reflection (context, questions, prayer prompt, application, ' +
      'memory verse). Reflections are cached per chapter — generated once, served forever.',
  })
  @ApiResponse({ status: 200, description: '{ chapter, reflection }' })
  getChapter(
    @Param('bibleId') bibleId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.scriptureService.getChapterWithReflection(bibleId, chapterId);
  }

  @Get('audio/:audioBibleId/chapters/:chapterId')
  @ApiOperation({
    summary: 'Get audio URL for a chapter',
    description:
      'Returns a streamable audio URL from api.bible. ' +
      'Pass the `audioBibleId` from GET /scripture/bibles/audio.',
  })
  getAudioChapter(
    @Param('audioBibleId') audioBibleId: string,
    @Param('chapterId') chapterId: string,
  ) {
    return this.bibleContent.getAudioChapter(audioBibleId, chapterId);
  }

  // ── User's daily reading ─────────────────────────────────────────────────

  @Get('today')
  @ApiOperation({
    summary: "Get today's reading for the authenticated user",
    description:
      'If the user has an active reading plan, returns today\'s chapter(s) with full text, ' +
      'structured verses, and AI reflection. ' +
      'Falls back to the global verse of the day if no plan is active. ' +
      'Auto-creates a DailyScripture record for tracking completion.',
  })
  @ApiQuery({ name: 'translationId', required: false, description: 'Optional ID of a Bible translation to override the plan\'s default version' })
  getTodayForUser(
    @CurrentUser() user: RequestUser,
    @Query('translationId') translationId?: string,
  ) {
    return this.scriptureService.getTodayForUser(user.id, translationId);
  }

  @Patch(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a scripture entry as read',
    description:
      'Sets `isCompleted: true` and records `completedAt`. ' +
      'Idempotent — safe to call multiple times. ' +
      'Increments `dailyBibleReadingStreakCount` in user metadata if consecutive days.',
  })
  markCompleted(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.scriptureService.markCompleted(id, user.id);
  }

  @Patch(':id/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save personal reflection notes on a scripture entry',
    description:
      'Updates the `personalNotes` field. Only the owner can edit their own notes.',
  })
  updateNotes(
    @Param('id') id: string,
    @Body() dto: UpdateNotesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.scriptureService.updateNotes(id, user.id, dto.notes);
  }

  @Get('history')
  @ApiOperation({
    summary: "Get the user's scripture reading history",
    description:
      'Returns DailyScripture records for the user, newest first. ' +
      'Completed entries have `isCompleted: true` and a `completedAt` timestamp.',
  })
  getHistory(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.scriptureService.findByUser(user.id, pagination);
  }

  // ── Reading plans ────────────────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({
    summary: 'List all available reading plans',
    description:
      'Returns the 5 built-in system plans: NT in 90 Days, Psalms in 30, ' +
      'Proverbs in 31, Gospels in 30, Bible in a Year.',
  })
  getPlans() {
    return this.readingPlans.getAvailablePlans();
  }

  @Post('plans/subscribe')
  @ApiOperation({
    summary: 'Subscribe to a reading plan',
    description:
      'Pauses any existing active plan and starts the new one from today. ' +
      'Pass `translationId` from GET /scripture/bibles to choose a translation.',
  })
  subscribeToPlan(
    @Body() dto: SubscribePlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.readingPlans.subscribeToplan(
      user.id,
      dto.planId,
      dto.translationId,
    );
  }

  @Get('plans/mine/all')
  @ApiOperation({
    summary: "List all active and paused reading plans for the authenticated user",
    description:
      'Returns every plan the user has subscribed to that has not been completed — ' +
      'including the currently active plan and any paused ones. ' +
      'Useful for showing overall progress across multiple plans. ' +
      '`currentDay` for paused plans reflects the day the plan was paused on, not today\'s date.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of non-completed user reading plans with progress',
    schema: {
      example: {
        success: true,
        data: [
          {
            id: '...',
            planId: '...',
            planName: 'New Testament in 90 Days',
            planDescription: '...',
            totalDays: 90,
            currentDay: 14,
            progressPercent: 16,
            status: 'active',
            translationId: 'de4e12af7f28f599-02',
            startDate: '2026-05-10T00:00:00.000Z',
          },
          {
            id: '...',
            planId: '...',
            planName: 'Psalms in 30 Days',
            planDescription: '...',
            totalDays: 30,
            currentDay: 7,
            progressPercent: 23,
            status: 'paused',
            translationId: 'de4e12af7f28f599-02',
            startDate: '2026-04-20T00:00:00.000Z',
          },
        ],
      },
    },
  })
  getAllMyPlans(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto,
  ) {
    return this.readingPlans.getAllNonCompletedPlans(user.id, pagination);
  }

  @Get('plans/mine')
  @ApiOperation({
    summary: "Get the authenticated user's active reading plan with progress",
  })
  getMyPlan(@CurrentUser() user: RequestUser) {
    return this.readingPlans.getActivePlan(user.id);
  }

  @Patch('plans/mine/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pause the active reading plan',
    description: 'Saves the current day so resuming picks up from here.',
  })
  pausePlan(@CurrentUser() user: RequestUser) {
    return this.readingPlans.pausePlan(user.id);
  }

  @Patch('plans/mine/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resume a specific paused reading plan',
    description:
      'Resumes the plan identified by `userPlanId`. ' +
      'If another plan is currently active it is automatically paused first. ' +
      'Use `GET /scripture/plans/mine/all` to get the `id` values for paused plans.',
  })
  resumePlan(
    @CurrentUser() user: RequestUser,
    @Body() dto: ResumePlanDto,
  ) {
    return this.readingPlans.resumePlan(user.id, dto.userPlanId);
  }

  // ── Bookmarks ────────────────────────────────────────────────────────────

  @Post('bookmarks')
  @ApiOperation({ summary: 'Bookmark a verse' })
  @ApiResponse({ status: 201, description: 'Bookmark created (or existing returned if duplicate)' })
  async addBookmark(
    @Body() dto: BookmarkVerseDto,
    @CurrentUser() user: RequestUser,
  ) {
    const existing = await this.bookmarkRepo.findExisting(
      user.id,
      dto.verseReference,
      dto.bibleId,
    );
    if (existing) return existing;

    return this.bookmarkRepo.create({ ...dto, userId: user.id });
  }

  @Get('bookmarks')
  @ApiOperation({ summary: "Get the user's bookmarked verses" })
  getBookmarks(@CurrentUser() user: RequestUser) {
    return this.bookmarkRepo.findByUser(user.id);
  }

  @Delete('bookmarks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a bookmarked verse' })
  deleteBookmark(@Param('id') id: string) {
    return this.bookmarkRepo.softDelete(id);
  }

  // ── ADMIN ────────────────────────────────────────────────────────────────

  @Get('user/:userId')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get a user's scripture history (ADMIN only)" })
  findByUser(
    @Param('userId') userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.scriptureService.findByUser(userId, pagination);
  }

  @Get('user/:userId/date/:date')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: "Get a user's entry for a specific date (ADMIN only, YYYY-MM-DD)" })
  findByDate(@Param('userId') userId: string, @Param('date') date: string) {
    return this.scriptureService.findByUserAndDate(userId, new Date(date));
  }
}
