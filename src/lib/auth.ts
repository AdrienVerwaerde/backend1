import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    advanced: {
        database: {
            generateId: false,
            disableCsrfCheck: true,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: ["http://localhost:3001", "http://localhost:3000"],
});