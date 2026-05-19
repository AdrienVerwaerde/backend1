import { Injectable, NestMiddleware } from '@nestjs/common';
import { auth } from './auth';  // your better-auth instance
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    constructor(private prisma: PrismaService) { }

    async use(req: any, res: any, next: () => void) {
        const session = await auth.api.getSession({
            headers: new Headers(req.headers),
        });

        if (session?.user) {
            const user = await this.prisma.user.findUnique({
                where: { id: session.user.id },
            });
            console.log('Full DB user:', user);
            req.user = user;
            req.dbUser = user;

            next();
        }
    }
}
