import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking, SeatAvailability } from './entities/booking.entity';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOkResponse({ type: [Booking], description: 'Усі бронювання' })
  findAll(): Booking[] {
    return this.bookingsService.findAll();
  }

  @Delete('bookings/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Бронювання скасовано, місця вільні' })
  @ApiBadRequestResponse({ description: 'id не є UUID' })
  @ApiNotFoundResponse({ description: 'Бронювання з таким id немає' })
  remove(@Param('id', ParseUUIDPipe) id: string): void {
    this.bookingsService.remove(id);
  }

  @Post('showings/:id/bookings')
  @ApiCreatedResponse({ type: Booking, description: 'Бронювання створено' })
  @ApiBadRequestResponse({
    description:
      'seats порожній, елемент без row/seat, місце повторюється або його немає в залі',
  })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  @ApiConflictResponse({
    description: 'Хоча б одне місце вже заброньоване; нічого не записано',
  })
  create(
    @Param('id', ParseUUIDPipe) showingId: string,
    @Body() dto: CreateBookingDto,
  ): Booking {
    return this.bookingsService.create(showingId, dto);
  }

  @Get('showings/:id/bookings')
  @ApiOkResponse({ type: [Booking], description: 'Бронювання сеансу' })
  @ApiBadRequestResponse({ description: 'id не є UUID' })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  findByShowing(@Param('id', ParseUUIDPipe) showingId: string): Booking[] {
    return this.bookingsService.findByShowing(showingId);
  }

  @Get('showings/:id/seats')
  @ApiOkResponse({
    type: [SeatAvailability],
    description: 'Усі місця залу з ознакою зайнятості на сеансі',
  })
  @ApiBadRequestResponse({ description: 'id не є UUID' })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  getSeats(@Param('id', ParseUUIDPipe) showingId: string): SeatAvailability[] {
    return this.bookingsService.getSeats(showingId);
  }
}
