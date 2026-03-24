import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

/**
 * Retry wrapper with exponential backoff for transient database failures.
 * Use for critical operations that should survive brief connectivity blips.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(
        `Database operation failed (attempt ${attempt + 1}/${retries}), retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Unreachable");
}
