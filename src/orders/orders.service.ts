import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { Prisma, OrderStatus } from '@prisma/client';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    // Reusable include for full order detail
    private readonly fullOrderInclude = {
        user: {
            select: { id: true, email: true, name: true },
        },
        items: {
            include: {
                product: {
                    select: { id: true, name: true, imageUrl: true },
                },
            },
        },
    } satisfies Prisma.OrderInclude;

    async create(dto: CreateOrderDto) {
        // 1. Verify user exists
        const user = await this.prisma.user.findUnique({
            where: { id: dto.userId },
        });
        if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

        // 2. Fetch all products in ONE query
        const productIds = dto.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
        });

        // 3. Validate every product exists & is available
        if (products.length !== productIds.length) {
            const foundIds = products.map((p) => p.id);
            const missing = productIds.filter((id) => !foundIds.includes(id));
            throw new NotFoundException(
                `Products not found: ${missing.join(', ')}`,
            );
        }

        const unavailable = products.filter((p) => !p.available);
        if (unavailable.length > 0) {
            throw new BadRequestException(
                `Products unavailable: ${unavailable.map((p) => p.name).join(', ')}`,
            );
        }

        // 4. Build items with PRICE SNAPSHOT + compute total
        const productMap = new Map(products.map((p) => [p.id, p]));
        let total = new Prisma.Decimal(0);

        const itemsData = dto.items.map((item) => {
            const product = productMap.get(item.productId)!;
            const lineTotal = product.price.mul(item.quantity);
            total = total.add(lineTotal);

            return {
                productId: product.id,
                quantity: item.quantity,
                unitPrice: product.price, // 📸 snapshot of current price
            };
        });

        // 5. Create order + items atomically
        return this.prisma.order.create({
            data: {
                userId: dto.userId,
                total,
                status: OrderStatus.PENDING,
                items: { create: itemsData },
            },
            include: this.fullOrderInclude,
        });
    }

    async findAll(pagination: OrderPaginationDto) {
        const { page = 1, limit = 10, userId, status } = pagination;
        const skip = (page - 1) * limit;

        const where: Prisma.OrderWhereInput = {
            ...(userId && { userId }),
            ...(status && { status }),
        };

        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: this.fullOrderInclude,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: number) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: this.fullOrderInclude,
        });
        if (!order) throw new NotFoundException(`Order ${id} not found`);
        return order;
    }

    async updateStatus(id: number, dto: UpdateOrderStatusDto) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException(`Order ${id} not found`);

        // Enforce a simple state machine
        this.assertValidTransition(order.status, dto.status);

        return this.prisma.order.update({
            where: { id },
            data: { status: dto.status },
            include: this.fullOrderInclude,
        });
    }

    async cancel(id: number) {
        const order = await this.prisma.order.findUnique({ where: { id } });
        if (!order) throw new NotFoundException(`Order ${id} not found`);

        if (order.status === OrderStatus.DELIVERED) {
            throw new BadRequestException('Cannot cancel a delivered order');
        }
        if (order.status === OrderStatus.CANCELLED) {
            throw new BadRequestException('Order already cancelled');
        }

        return this.prisma.order.update({
            where: { id },
            data: { status: OrderStatus.CANCELLED },
            include: this.fullOrderInclude,
        });
    }

    // --- Helpers ---
    private assertValidTransition(from: OrderStatus, to: OrderStatus) {
        const allowed: Record<OrderStatus, OrderStatus[]> = {
            PENDING: ['PREPARING', 'CANCELLED'] as OrderStatus[],
            PREPARING: ['READY', 'CANCELLED'] as OrderStatus[],
            READY: ['DELIVERED', 'CANCELLED'] as OrderStatus[],
            DELIVERED: [],
            CANCELLED: [],
        };

        if (!allowed[from].includes(to)) {
            throw new BadRequestException(
                `Cannot transition from ${from} to ${to}`,
            );
        }
    }
}
