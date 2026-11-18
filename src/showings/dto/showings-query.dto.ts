import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class ShowingsQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Залишити сеанси лише цього фільму',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  filmId?: string;

  @ApiPropertyOptional({
    example: '2030-05-01',
    description: 'Залишити сеанси, що починаються цієї доби (UTC), YYYY-MM-DD',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must match YYYY-MM-DD' })
  @IsISO8601({ strict: true }, { message: 'date must be a real calendar date' })
  date?: string;
}
