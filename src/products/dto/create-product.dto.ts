import { Type } from 'class-transformer';
import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Min,
    MinLength,
} from 'class-validator';

export class CreateProductDto {
    @IsString()
    @MinLength(2)
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    price: number;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;

    @IsOptional()
    @IsBoolean()
    available?: boolean;
}
