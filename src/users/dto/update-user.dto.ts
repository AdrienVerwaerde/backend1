import { IsString, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
    @IsString()
    @MinLength(2)
    @MaxLength(50)
    @Transform(({ value }) => value?.trim())
    name: string;

    @IsString()
    @MinLength(8)
    @MaxLength(100)
    password: string;
}
