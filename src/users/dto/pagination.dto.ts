import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, Max, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class PaginationDto {
    // Offset pagination
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    // Cursor pagination
    @IsOptional()
    @IsString()
    cursor?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
