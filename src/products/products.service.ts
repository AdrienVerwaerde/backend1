import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductPaginationDto } from './dto/product-pagination.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsService {
    constructor(private prisma: PrismaService) { }

    create(dto: CreateProductDto) {
        return this.prisma.product.create({ data: dto });
    }

    async findAll(pagination: ProductPaginationDto) {
        const { page, limit = 10, cursor, search, available } = pagination;

        // Build the WHERE clause based on filters
        const where: Prisma.ProductWhereInput = {
            ...(available !== undefined && { available }),
            ...(search && {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
        };

        // --- CURSOR PAGINATION ---
        if (cursor !== undefined) {
            const items = await this.prisma.product.findMany({
                where,
                take: limit + 1,
                ...(cursor > 0 && {
                    skip: 1,
                    cursor: { id: cursor },
                }),
                orderBy: { id: 'asc' },
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
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { id: 'asc' },
            }),
            this.prisma.product.count({ where }),
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
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) {
            throw new NotFoundException(`Product with id ${id} not found`);
        }
        return product;
    }

    async update(id: number, dto: UpdateProductDto) {
        await this.findOne(id);
        return this.prisma.product.update({ where: { id }, data: dto });
    }

    async remove(id: number) {
        await this.findOne(id);
        // Soft-disable instead of hard delete to preserve order history 🧠
        return this.prisma.product.update({
            where: { id },
            data: { available: false },
        });
    }

    // Hard delete
    async hardRemove(id: number) {
        await this.findOne(id);
        return this.prisma.product.delete({ where: { id } });
    }
}
