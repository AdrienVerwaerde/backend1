import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Delete,
    Query,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductPaginationDto } from './dto/product-pagination.dto';

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@Body() dto: CreateProductDto) {
        return this.productsService.create(dto);
    }

    @Get()
    findAll(@Query() pagination: ProductPaginationDto) {
        return this.productsService.findAll(pagination);
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.productsService.findOne(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: number,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productsService.update(id, dto);
    }

    // Soft delete (sets available = false)
    @Delete(':id')
    remove(@Param('id') id: number) {
        return this.productsService.remove(id);
    }

    // Hard delete (truly removes, fails if referenced)
    @Delete(':id/hard')
    hardRemove(@Param('id') id: number) {
        return this.productsService.hardRemove(id);
    }
}
