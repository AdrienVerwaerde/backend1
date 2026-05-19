import { IsString, MinLength, MaxLength, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { Role } from '@prisma/client';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Transform(({ value }) => value?.trim())
    name: string;

    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
