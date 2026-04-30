import {
    IsEmail,
    IsString,
    IsOptional,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
    @IsEmail({}, { message: 'Email must be a valid email address' })
    @Transform(({ value }) => value?.toLowerCase().trim())
    email: string;

    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    @MaxLength(50, { message: 'Name must not exceed 50 characters' })
    @Transform(({ value }) => value?.trim())
    name?: string;

    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters long' })
    @MaxLength(100, { message: 'Password must not exceed 100 characters' })
    @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number or special character',
    })
    password: string;
}
