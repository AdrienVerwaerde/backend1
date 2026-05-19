import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    create(@Body() dto: CreateOrderDto) {
        return this.ordersService.create(dto);
    }

    @Get()
    findAll(@Query() pagination: OrderPaginationDto) {
        return this.ordersService.findAll(pagination);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.ordersService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: number,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return this.ordersService.updateStatus(id, dto);
    }

    @Delete(':id')
    cancel(@Param('id') id: number) {
        return this.ordersService.cancel(id);
    }
}
