import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) { }

  // Common select to avoid leaking password
  private readonly safeUserSelect = {
    id: true,
    email: true,
    name: true,
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

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
      },
      select: this.safeUserSelect,
    });
  }

  async findAll(pagination: PaginationDto) {
    const { page, limit = 10, cursor } = pagination;

    // --- CURSOR PAGINATION ---
    if (cursor !== undefined) {
      const items = await this.prisma.user.findMany({
        take: limit + 1,
        ...(cursor > 0 && {
          skip: 1,
          cursor: { id: cursor },
        }),
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

    // --- CLASSIC PAGINATION ---
    const currentPage = page ?? 1;
    const skip = (currentPage - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { id: 'asc' },
        select: this.safeUserSelect,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data,
      pagination: {
        type: 'offset',
        page: currentPage,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: currentPage * limit < total,
        hasPrevPage: currentPage > 1,
      },
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.safeUserSelect,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  // 🆕 Fetch a user WITH their orders
  async findOneWithOrders(id: number) {
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

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id); // ensures it exists

    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: this.safeUserSelect,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Thanks to onDelete: Cascade in schema, orders will be deleted too 🧹
    return this.prisma.user.delete({
      where: { id },
      select: this.safeUserSelect,
    });
  }
}
