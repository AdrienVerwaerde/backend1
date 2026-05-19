import { Injectable, NestMiddleware } from '@nestjs/common';
import { auth } from './auth';  // your better-auth instance

@Injectable()
export class AuthMiddleware implements NestMiddleware {
    async use(req: any, res: any, next: () => void) {
        const session = await auth.api.getSession({
            headers: new Headers(req.headers),
        });

        req.user = session?.user ?? null;
        next();
    }
}
