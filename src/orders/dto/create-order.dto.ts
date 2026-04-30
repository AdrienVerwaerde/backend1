import { Type } from 'class-transformer';
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    Min,
    ValidateNested,
} from 'class-validator';

export class OrderItemDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    productId: number;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    userId: number;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];
}
