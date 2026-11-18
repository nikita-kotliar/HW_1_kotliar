import { ApiProperty } from '@nestjs/swagger';

export class Film {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  title: string;

  @ApiProperty({ example: 166 })
  durationMinutes: number;

  @ApiProperty({ example: 2024 })
  releaseYear: number;
}
