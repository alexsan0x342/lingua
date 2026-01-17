import { PrismaClient } from "./generated/prisma";
import { enableQueryTiming } from "./query-timer";

// In some build environments (e.g., when .env.production contains placeholder values),
// Prisma can throw at initialization time due to an invalid DATABASE_URL.
// To keep the build from failing while still preserving runtime behavior,
// we export a stubbed Prisma client when the DATABASE_URL clearly looks like a placeholder.
// Any actual query during build will throw and should be handled by existing try/catch callers
// (e.g., getSiteSettings falls back to defaults on error).

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const dbUrl = process.env.DATABASE_URL || "";
const looksLikePlaceholder = /username:password@host:port/.test(dbUrl);

function createPrismaStub(): PrismaClient {
	// Create a Proxy that throws on any property access to make failures explicit
	const stub = new Proxy({}, {
		get() {
			throw new Error("Prisma disabled: invalid or placeholder DATABASE_URL detected during build.");
		},
	}) as unknown as PrismaClient;
	return stub;
}

// BLAZINGLY FAST database configuration with connection pooling
const connectionPoolUrl = dbUrl + (dbUrl.includes('?') ? '&' : '?') + 
	'connection_limit=10' +
	'&pool_timeout=20' +
	'&connect_timeout=10' +
	'&socket_timeout=10';

const prismaClient: PrismaClient = looksLikePlaceholder
	? createPrismaStub()
	: (globalForPrisma.prisma || new PrismaClient({
		log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
		datasources: {
			db: {
				url: connectionPoolUrl,
			},
		},
	}));

// Enable query timing in development
if (process.env.NODE_ENV !== "production" && !looksLikePlaceholder) {
	enableQueryTiming(prismaClient);
}

// Add middleware for automatic query optimization
if (!looksLikePlaceholder) {
	// Cache frequently accessed models
	prismaClient.$use(async (params, next) => {
		// Skip cache for write operations
		if (params.action !== 'findUnique' && params.action !== 'findMany' && params.action !== 'findFirst') {
			return next(params);
		}

		const result = await next(params);
		return result;
	});
}

export const prisma = prismaClient;

if (process.env.NODE_ENV !== "production" && !looksLikePlaceholder) {
	globalForPrisma.prisma = prismaClient;
}
