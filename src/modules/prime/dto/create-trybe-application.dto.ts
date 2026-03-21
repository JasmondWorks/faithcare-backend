import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum } from 'class-validator';
import { Gender } from 'src/core/enums/gender.enum';
import { TrybeMembershipStatus } from 'src/core/enums/trybe-membership-status.enum';
import { TrybeIntent } from 'src/core/enums/trybe-intent.enum';
import { TrybeCategory } from 'src/core/enums/trybe-category.enum';

export class CreateTrybeApplicationDto {
  @ApiProperty({ example: 'Jane Okafor' })
  @IsString()
  name: string;

  @ApiProperty({ example: '+2348098765432' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ enum: TrybeMembershipStatus })
  @IsEnum(TrybeMembershipStatus)
  isAMember: TrybeMembershipStatus;

  @ApiProperty({ example: 'UI/UX Design, Video Editing' })
  @IsString()
  skills: string;

  @ApiProperty({ enum: TrybeIntent })
  @IsEnum(TrybeIntent)
  whatWouldYouLikeToDo: TrybeIntent;

  @ApiProperty({ example: 'I want to grow and connect with like-minded creatives.' })
  @IsString()
  whyWouldYouLikeToJoin: string;

  @ApiProperty({ enum: TrybeCategory })
  @IsEnum(TrybeCategory)
  whichTrybeCategoryToJoin: TrybeCategory;
}
