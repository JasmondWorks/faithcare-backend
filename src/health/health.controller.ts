import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Public } from 'src/core/decorators/public.decorator';

@ApiTags('General')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Check API and database health' })
  check() {
    return this.health.check([
      () => this.mongoose.pingCheck('mongodb'),
    ]);
  }
}
