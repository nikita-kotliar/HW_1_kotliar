import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateShowingDto } from './dto/create-showing.dto';
import { ShowingsQueryDto } from './dto/showings-query.dto';
import { Showing, ShowingView } from './entities/showing.entity';
import { ShowingsService } from './showings.service';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiCreatedResponse({ type: Showing, description: 'Сеанс створено' })
  @ApiBadRequestResponse({
    description:
      'Фільму або залу немає; startsAt некоректна або в минулому; price не ціле додатне',
  })
  create(@Body() dto: CreateShowingDto): Showing {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOkResponse({
    type: [ShowingView],
    description: 'Сеанси, відсортовані за часом початку, при рівності за id',
  })
  @ApiBadRequestResponse({ description: 'date не відповідає формату' })
  findAll(@Query() query: ShowingsQueryDto): ShowingView[] {
    return this.showingsService.findAll(query);
  }

  @Get(':id')
  @ApiOkResponse({ type: ShowingView })
  @ApiBadRequestResponse({ description: 'id не є UUID' })
  @ApiNotFoundResponse({ description: 'Сеансу з таким id немає' })
  findOne(@Param('id', ParseUUIDPipe) id: string): ShowingView {
    return this.showingsService.findOneView(id);
  }
}
