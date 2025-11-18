import app from './app';
import path from 'path';

// Explicit path untuk .env file
const envPath = path.join(__dirname, '..', '.env');
console.log('🔧 Loading .env from:', envPath);

// Load .env file dan parse manual untuk override system env (opsional di Cloud Run)
const fs = require('fs');
const envConfig: { [key: string]: string } = {};
try {
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envLines = envFile.split('\n');
    envLines.forEach((line: string) => {
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, value] = line.split('=');
        envConfig[key.trim()] = value.trim().replace(/"/g, '');
      }
    });
  } else {
    console.log('ℹ️ .env file not found, relying on environment variables');
  }
} catch (err) {
  console.warn('⚠️ Failed to read .env file, continuing without it:', err);
}

// Merge local .env values into process.env when not already provided by the system.
// This ensures the service uses the repository .env during local development but
// does not override explicit environment variables provided by the host (e.g., CI, Cloud Run).
Object.keys(envConfig).forEach((key) => {
  if (!process.env[key]) {
    process.env[key] = envConfig[key];
  }
});

console.log('🔍 Environment Variables:');
console.log('System process.env.PORT:', process.env.PORT);
console.log('Local .env PORT:', envConfig.PORT);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Found' : 'Not found');
console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL ? 'loaded ✅' : 'NOT loaded ❌');

// Use PORT environment variable for Cloud Run compatibility
const PORT = Number(envConfig.PORT) || Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

console.log(`🎯 Selected PORT: ${PORT}`);

app.listen(PORT, () => {
  console.log(`🚀 Engineering service listening on port ${PORT}`);
  // WARNING: temporary debug log — remove in production to avoid leaking DB credentials
  // console.log('DEBUG DATABASE_URL:', process.env.DATABASE_URL);
});