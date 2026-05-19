import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth/auth';



@Module({
  imports: [PrismaModule, UsersModule, ProductsModule, OrdersModule, AuthModule.forRoot({ auth }),],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

