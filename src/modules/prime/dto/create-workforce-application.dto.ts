import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsBoolean,
  IsArray,
  IsEnum,
  ArrayMinSize,
} from 'class-validator';
import { Department } from 'src/core/enums/department.enum';

export class CreateWorkforceApplicationDto {
  @ApiProperty({ example: 'John Adeyemi' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '12 Unity Street, Lagos' })
  @IsString()
  address: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  haveServedInADepartment: boolean;

  @ApiProperty({
    enum: Department,
    isArray: true,
    example: [Department.SOUND_TRYBE, Department.MEDIA_TECHNICAL],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(Department, { each: true })
  departmentToServeIn: Department[];
}
