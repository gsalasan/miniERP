// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

let PrismaClient: any;

try {
  // Always load from workspace root since schema is at root
  // From src/utils, go up 4 levels: utils -> src -> procurement-service -> services -> root
  const rootPath = path.resolve(__dirname, '../../../..');
  const rootClientPath = path.join(rootPath, 'node_modules', '@prisma', 'client');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  PrismaClient = require(rootClientPath).PrismaClient;
} catch (err) {
  console.error('\nMissing required package "@prisma/client" in workspace root.');
  console.error('Fix: run the following commands in your repository root:');
  console.error('\n  npm install');
  console.error('  npx prisma generate');
  console.error('\nAfter that, restart the service.');
  // Exit so the developer sees the message instead of a stack trace
  // process.exit is appropriate for dev-time startup errors
  process.exit(1);
}

// Reduce verbosity by logging only warnings and errors in development
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

export default prisma;