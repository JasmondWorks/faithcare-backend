import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EnqueueCollectionDto {
  @ApiProperty({ description: 'VerseCollection document ID' })
  @IsMongoId()
  collectionId: string;
}
