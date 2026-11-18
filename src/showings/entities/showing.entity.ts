import { ApiProperty } from '@nestjs/swagger';

/** Сеанс у тому вигляді, як він зберігається. */
export class Showing {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  filmId: string;

  @ApiProperty({ format: 'uuid' })
  hallId: string;

  @ApiProperty({ example: '2030-05-01T18:30:00.000Z' })
  startsAt: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;
}

/** Сеанс для відповіді: назви фільму й залу замість ідентифікаторів. */
export class ShowingView {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Dune: Part Two' })
  filmTitle: string;

  @ApiProperty({ example: 'Зал 1' })
  hallName: string;

  @ApiProperty({ example: '2030-05-01T18:30:00.000Z' })
  startsAt: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  price: number;
}
