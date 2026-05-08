const http   = require('http');
const crypto = require('crypto');
const express = require('express');
const path    = require('path');

const debug = (msg) => process.env.DEBUG && console.log(`[tasknest:server] ${msg}`);

const app = express();

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

const normalizedPort = (val) => {
  const port = parseInt(val, 10);
  if (isNaN(port)) return val;   // named pipe
  if (port >= 0)   return port;  // valid port number
  return false;
};

var PORT = normalizedPort(process.env.PORT || 3000);
app.set('port', PORT);
const HOST = process.env.HOST || '0.0.0.0';

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const RATE_LIMIT_MAX = 120;         // max 120 requests per window per IP

const buckets = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const entry = buckets.get(ip);
  if (!entry || entry.resetAt <= now) {
    buckets.set(ip, { resetAt: now + RATE_LIMIT_WINDOW_MS, count: 1 });
    return { ok: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }
  entry.count += 1;
  const remaining = Math.max(0, RATE_LIMIT_MAX - entry.count);
  return { ok: entry.count <= RATE_LIMIT_MAX, remaining, resetAt: entry.resetAt };
}

function send(res, statusCode, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const baseHeaders = {
    'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    ...headers,
  };
  res.writeHead(statusCode, baseHeaders);
  res.end(payload);
}

function safeLogLine(req, statusCode) {
  const ip     = req.socket.remoteAddress ?? 'unknown';
  const method = req.method ?? 'UNKNOWN';
  const url    = req.url ?? '/';
  console.log(`${new Date().toISOString()} ${ip} ${method} ${url} ${statusCode}`);
}

// ============================================================================
// SERVER EVENT HANDLERS
// ============================================================================

const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
};

const onError = (error) => {
  if (error.syscall !== 'listen') throw error;
  const bind = typeof PORT === 'string' ? 'pipe ' + PORT : 'port ' + PORT;
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// ============================================================================
// EXPRESS SETUP (async — needs GraphQL middleware)
// ============================================================================

const distPath = path.join(__dirname, 'dist', 'ourAngularFirst', 'browser');

// Security headers for all Express responses
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

(async () => {
  const { createGraphQLMiddleware } = require('./backend/dist/graphql');
  const graphqlHandler = await createGraphQLMiddleware();

  app.use('/graphql', express.json(), graphqlHandler);
  app.use(express.static(distPath));
  app.use((_req, res) => res.sendFile(path.join(distPath, 'index.html')));

  // ============================================================================
  // CREATE HTTP SERVER
  // ============================================================================

  const server = http.createServer((req, res) => {
    try {
      const ip = req.socket.remoteAddress || 'unknown';
      const rl = rateLimit(ip);

      res.setHeader('RateLimit-Limit',     String(RATE_LIMIT_MAX));
      res.setHeader('RateLimit-Remaining', String(rl.remaining));
      res.setHeader('RateLimit-Reset',     String(Math.ceil(rl.resetAt / 1000)));

      if (!rl.ok) {
        send(res, 429, { error: 'Too Many Requests' });
        safeLogLine(req, 429);
        return;
      }

      const u = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

      if (u.pathname === '/health') {
        send(res, 200, { ok: true });
        safeLogLine(req, 200);
        return;
      }

      if (u.pathname === '/nonce') {
        const nonce = crypto.randomBytes(16).toString('hex');
        send(res, 200, { nonce });
        safeLogLine(req, 200);
        return;
      }

      // Delegate everything else to Express (handles /graphql + Angular static files)
      app(req, res, () => {
        send(res, 404, { error: 'Not Found' });
        safeLogLine(req, 404);
      });
    } catch (err) {
      send(res, 500, { error: 'Internal Server Error' });
      console.error(err);
      safeLogLine(req, 500);
    }
  });

  server.on('clientError', (_err, socket) => socket.end('HTTP/1.1 400 Bad Request\r\n\r\n'));

  server.listen(PORT, HOST, () => {
    console.log(`Listening on http://${HOST}:${PORT}`);
  });

  server.on('error', onError);
  server.on('listening', onListening);
})();
