import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // Common select to avoid leaking sensitive fields
  private readonly safeUserSelect = {
    id: true,
    email: true,
    name: true,
    role: true,
    emailVerified: true,
    createdAt: true,
    updatedAt: true,
  };

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
      },
      select: this.safeUserSelect,
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit = 10, cursor, role } = pagination;

    const where = role ? { role } : {};

    if (cursor !== undefined) {
      const items = await this.prisma.user.findMany({
        take: limit + 1,
        ...(cursor && {
          skip: 1,
          cursor: { id: cursor },
        }),
        where,
        orderBy: { id: 'asc' },
        select: this.safeUserSelect,
      });

      const hasNextPage = items.length > limit;
      const data = hasNextPage ? items.slice(0, limit) : items;
      const nextCursor = hasNextPage ? data[data.length - 1].id : null;

      return {
        data,
        pagination: { type: 'cursor', limit, nextCursor, hasNextPage },
      };
    }

    // Classic pagination
    const skip = page ? (page - 1) * limit : 0;
    const [total, data] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        skip,
        take: limit,
        where,
        orderBy: { id: 'asc' },
        select: this.safeUserSelect,
      }),
    ]);

    return {
      data,
      pagination: {
        type: 'offset',
        total,
        page: page ?? 1,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findOneWithOrders(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...this.safeUserSelect,
        orders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            total: true,
            createdAt: true,
            items: {
              select: {
                quantity: true,
                unitPrice: true,
                product: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // ensures it exists

    return this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        role: dto.role,
      },
      select: this.safeUserSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Thanks to onDelete: Cascade in schema, orders will be deleted too 🧹
    return this.prisma.user.delete({
      where: { id },
      select: this.safeUserSelect,
    });
  }
}
