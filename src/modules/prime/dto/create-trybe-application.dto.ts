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

  @ApiProperty({
    enum: Gender,
    enumName: 'Gender',
    description: 'Allowed values: ' + Object.values(Gender).join(' | '),
    example: Gender.FEMALE,
  })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({
    enum: TrybeMembershipStatus,
    enumName: 'TrybeMembershipStatus',
    description: 'Whether the applicant is already a church member. Allowed values: ' + Object.values(TrybeMembershipStatus).join(' | '),
    example: TrybeMembershipStatus.YES,
  })
  @IsEnum(TrybeMembershipStatus)
  isAMember: TrybeMembershipStatus;

  @ApiProperty({ example: 'UI/UX Design, Video Editing' })
  @IsString()
  skills: string;

  @ApiProperty({
    enum: TrybeIntent,
    enumName: 'TrybeIntent',
    description: 'What the applicant would like to do in Trybe. Allowed values: ' + Object.values(TrybeIntent).join(' | '),
    example: TrybeIntent.JOIN,
  })
  @IsEnum(TrybeIntent)
  whatWouldYouLikeToDo: TrybeIntent;

  @ApiProperty({ example: 'I want to grow and connect with like-minded creatives.' })
  @IsString()
  whyWouldYouLikeToJoin: string;

  @ApiProperty({
    enum: TrybeCategory,
    enumName: 'TrybeCategory',
    description: 'The Trybe category the applicant wants to join. Allowed values: ' + Object.values(TrybeCategory).join(' | '),
    example: TrybeCategory.CREATIVE,
  })
  @IsEnum(TrybeCategory)
  whichTrybeCategoryToJoin: TrybeCategory;
}
