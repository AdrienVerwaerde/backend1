import { Param, ParseUUIDPipe } from '@nestjs/common';

export const UUIDParam = (param: string = 'id') =>
    Param(param, new ParseUUIDPipe({ version: '4' }));
