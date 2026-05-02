import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageTemplateDto {
  @ApiProperty({ example: 'Welcome Message' })
  @IsString()
  name: string;

  @ApiProperty({ enum: ['whatsapp', 'sms', 'email'], example: 'whatsapp' })
  @IsEnum(['whatsapp', 'sms', 'email'])
  channel: string;

  @ApiProperty({
    enum: ['on_registration', 'day_1', 'day_3', 'day_7', 'manual'],
    example: 'manual',
  })
  @IsEnum(['on_registration', 'day_1', 'day_3', 'day_7', 'manual'])
  trigger: string;

  @ApiProperty({ example: 'Hi {{name}}, welcome to {{church_name}}!' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ type: [String], example: ['name', 'church_name'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
