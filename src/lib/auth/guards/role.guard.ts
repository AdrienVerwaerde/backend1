import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
        if (!requiredRoles || requiredRoles.length === 0) return true;

        const request = context.switchToHttp().getRequest();
        const user = request.dbUser ?? request.user;
        console.log('RoleGuard user:', user);

        console.log('RoleGuard user:', user); // debug
        console.log('Required roles:', requiredRoles);

        if (!user) throw new ForbiddenException();
        if (!requiredRoles.includes(user.role)) throw new ForbiddenException();

        return true;
    }
}
