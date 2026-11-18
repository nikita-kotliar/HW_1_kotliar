import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ShowingsService } from '../showings/showings.service';
import { CreateHallDto } from './dto/create-hall.dto';
import { Hall, HallWithSeats, Seat } from './entities/hall.entity';

@Injectable()
export class HallsService {
  private readonly halls: Hall[] = [];

  constructor(
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateHallDto): Hall {
    const name = dto.name.trim();
    const taken = this.halls.some(
      (hall) => hall.name.toLowerCase() === name.toLowerCase(),
    );
    if (taken) {
      throw new ConflictException(`Hall with name "${name}" already exists`);
    }
    const hall: Hall = { id: randomUUID(), ...dto, name };
    this.halls.push(hall);
    return hall;
  }

  findAll(): Hall[] {
    return this.halls;
  }

  /** Повертає зал або undefined: для перевірок з інших модулів. */
  find(id: string): Hall | undefined {
    return this.halls.find((hall) => hall.id === id);
  }

  findOne(id: string): Hall {
    const hall = this.find(id);
    if (!hall) {
      throw new NotFoundException(`Hall with id "${id}" not found`);
    }
    return hall;
  }

  findOneWithSeats(id: string): HallWithSeats {
    const hall = this.findOne(id);
    return { ...hall, seats: this.getSeats(hall) };
  }

  /** Перелік місць залу: ряди 1..rows, у кожному місця 1..seatsPerRow. */
  getSeats(hall: Hall): Seat[] {
    const seats: Seat[] = [];
    for (let row = 1; row <= hall.rows; row++) {
      for (let seat = 1; seat <= hall.seatsPerRow; seat++) {
        seats.push({ row, seat });
      }
    }
    return seats;
  }

  hasSeat(hall: Hall, seat: Seat): boolean {
    return (
      seat.row >= 1 &&
      seat.row <= hall.rows &&
      seat.seat >= 1 &&
      seat.seat <= hall.seatsPerRow
    );
  }

  remove(id: string): void {
    const hall = this.findOne(id);
    if (this.showingsService.hasShowingsForHall(hall.id)) {
      throw new ConflictException(
        `Hall with id "${id}" is used by at least one showing`,
      );
    }
    this.halls.splice(this.halls.indexOf(hall), 1);
  }
}
