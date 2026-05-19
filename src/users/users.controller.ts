import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { DeleteRoute } from '../../src/common/decorators/delete-route';
import { Session, UserSession, AllowAnonymous, OptionalAuth } from '@thallesp/nestjs-better-auth';
import { SessionGuard } from 'src/lib/auth/guards/session.guard';
import { RoleGuard } from 'src/lib/auth/guards/role.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll(@Query() pagination: PaginationDto) {
    return this.usersService.findAll(pagination);
  }


  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/orders')
  findOneWithOrders(@Param('id') id: string) {
    return this.usersService.findOneWithOrders(id);
  }

  @Get('me')
  async getProfile(@Session() session: UserSession) {
    return { user: session.user };
  }

  @Get('public')
  @AllowAnonymous() // Allow anonymous access
  async getPublic() {
    return { message: 'Public route' };
  }

  @Get('optional')
  @OptionalAuth() // Authentication is optional
  async getOptional(@Session() session: UserSession) {
    return { authenticated: !!session };
  }

  @Get('admin/dashboard')
  @Roles('ADMIN')
  @UseGuards(SessionGuard, RoleGuard)
  adminDashboard(@Req() req: any) {
    console.log('User:', req.user);
    return { message: 'Welcome, Admin!' };
  }

  @Patch(':id')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @DeleteRoute()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}