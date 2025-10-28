import app from './app';
import path from 'path';

// Explicit path untuk .env file
const envPath = path.join(__dirname, '..', '.env');
console.log('🔧 Loading .env from:', envPath);

// Load .env file dan parse manual untuk override system env
const fs = require('fs');
const envFile = fs.readFileSync(envPath, 'utf8');
const envLines = envFile.split('\n');
const envConfig: { [key: string]: string } = {};

envLines.forEach((line: string) => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, value] = line.split('=');
    envConfig[key.trim()] = value.trim().replace(/"/g, '');
  }
});

console.log('🔍 Environment Variables:');
console.log('System process.env.PORT:', process.env.PORT);
console.log('Local .env PORT:', envConfig.PORT);
console.log('process.env.NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET:', envConfig.JWT_SECRET ? 'Found' : 'Not found');

// FORCE menggunakan PORT dari .env file, bukan dari system
const PORT = parseInt(envConfig.PORT || '3002', 10);

console.log(`🎯 Selected PORT: ${PORT}`);

app.listen(PORT, () => {
  console.log(`🚀 Engineering service listening on port ${PORT}`);
});
