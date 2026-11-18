import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Seat } from '../halls/entities/hall.entity';
import { HallsService } from '../halls/halls.service';
import { ShowingsService } from '../showings/showings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking, SeatAvailability } from './entities/booking.entity';

const seatKey = (s: Seat) => `${s.row}:${s.seat}`;

@Injectable()
export class BookingsService {
  private readonly bookings: Booking[] = [];

  constructor(
    private readonly showingsService: ShowingsService,
    private readonly hallsService: HallsService,
  ) {}

  create(showingId: string, dto: CreateBookingDto): Booking {
    const showing = this.showingsService.findOne(showingId);
    const hall = this.hallsService.findOne(showing.hallId);

    const outside = dto.seats.filter(
      (s) => !this.hallsService.hasSeat(hall, s),
    );
    if (outside.length) {
      throw new BadRequestException(
        `Seats not in hall "${hall.name}" (${hall.rows}x${hall.seatsPerRow}): ` +
          outside.map(seatKey).join(', '),
      );
    }

    // Спочатку перевіряємо всі місця, і лише потім записуємо:
    // при конфлікті жодне місце не бронюється.
    const booked = this.bookedKeys(showing.id);
    const taken = dto.seats.filter((s) => booked.has(seatKey(s)));
    if (taken.length) {
      throw new ConflictException(
        `Seats already booked: ${taken.map(seatKey).join(', ')}`,
      );
    }

    const booking: Booking = {
      id: randomUUID(),
      showingId: showing.id,
      seats: dto.seats.map(({ row, seat }) => ({ row, seat })),
      totalPrice: showing.price * dto.seats.length,
    };
    this.bookings.push(booking);
    return booking;
  }

  findAll(): Booking[] {
    return this.bookings;
  }

  findByShowing(showingId: string): Booking[] {
    const showing = this.showingsService.findOne(showingId);
    return this.bookings.filter((b) => b.showingId === showing.id);
  }

  getSeats(showingId: string): SeatAvailability[] {
    const showing = this.showingsService.findOne(showingId);
    const hall = this.hallsService.findOne(showing.hallId);
    const booked = this.bookedKeys(showing.id);
    return this.hallsService
      .getSeats(hall)
      .map((s) => ({ ...s, isBooked: booked.has(seatKey(s)) }));
  }

  remove(id: string): void {
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new NotFoundException(`Booking with id "${id}" not found`);
    }
    this.bookings.splice(index, 1);
  }

  private bookedKeys(showingId: string): Set<string> {
    return new Set(
      this.bookings
        .filter((b) => b.showingId === showingId)
        .flatMap((b) => b.seats.map(seatKey)),
    );
  }
}
