import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Public } from 'src/core/decorators/public.decorator';
import { WorkforceApplicationService } from '../services/workforce-application.service';
import { TrybeApplicationService } from '../services/trybe-application.service';
import { PrimePrayerRequestService } from '../services/prime-prayer-request.service';
import { CreateWorkforceApplicationDto } from '../dto/create-workforce-application.dto';
import { CreateTrybeApplicationDto } from '../dto/create-trybe-application.dto';
import { CreatePrimePrayerRequestDto } from '../dto/create-prime-prayer-request.dto';

@ApiTags('Prime Church')
@Public()
@Controller('prime')
export class PrimeController {
  constructor(
    private readonly workforceApplicationService: WorkforceApplicationService,
    private readonly trybeApplicationService: TrybeApplicationService,
    private readonly primePrayerRequestService: PrimePrayerRequestService,
  ) {}

  @Post('workforce')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
  @ApiBody({ type: CreateWorkforceApplicationDto })
  @ApiOperation({ summary: 'Submit a workforce volunteer application' })
  joinWorkforce(@Body() dto: CreateWorkforceApplicationDto) {
    return this.workforceApplicationService.apply(dto);
  }

  @Post('trybe')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
  @ApiBody({ type: CreateTrybeApplicationDto })
  @ApiOperation({ summary: 'Submit a Trybe membership application' })
  joinTrybe(@Body() dto: CreateTrybeApplicationDto) {
    return this.trybeApplicationService.apply(dto);
  }

  @Post('prayer-request')
  @HttpCode(HttpStatus.CREATED)
  @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
  @ApiBody({ type: CreatePrimePrayerRequestDto })
  @ApiOperation({ summary: 'Submit a prayer request' })
  submitPrayerRequest(@Body() dto: CreatePrimePrayerRequestDto) {
    return this.primePrayerRequestService.submit(dto);
  }
}
