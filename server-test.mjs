import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/test') {
    const file = fs.readFileSync(path.join(__dirname, 'test-project-flow.html'), 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(file);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8888, '0.0.0.0', () => {
  console.log('Test server running at http://localhost:8888/test');
});
