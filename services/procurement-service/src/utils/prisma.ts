let PrismaClient: any;

try {
  // Prefer local @prisma/client
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaClient = require('@prisma/client').PrismaClient;
} catch (err) {
  try {
    // Try loading from workspace root node_modules as a fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path');
    const rootClientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    PrismaClient = require(rootClientPath).PrismaClient;
  } catch (err2) {
    console.error('\nMissing required package "@prisma/client".');
    console.error('Fix: run the following commands in your repository root:');
    console.error('\n  npm install');
    console.error('  npx prisma generate');
    console.error('\nOr install only for procurement-service:');
    console.error('\n  npm install --prefix services/procurement-service');
    console.error('  npx prisma generate --schema=prisma/schema.prisma');
    console.error('\nAfter that, restart the service.');
    // Exit so the developer sees the message instead of a stack trace
    // process.exit is appropriate for dev-time startup errors
    process.exit(1);
  }
}

// Reduce verbosity by logging only warnings and errors in development
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export default prisma;