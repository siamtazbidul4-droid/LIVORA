import 'dotenv/config';
import express from 'express';
import { app } from './src/server/app';
import { connectDB } from './src/server/config/db';
import { seedDatabaseIfEmpty } from './src/server/seed/seedData';
import { assertAuthConfig } from './src/server/middleware/auth';
import { assertAdminConfig, ensureConfiguredAdminAccount } from './src/server/services/adminAccount';
import path from 'path';

// The server is always started from the project root (npm start / deployment
// start command), so resolve static assets relative to the working directory.
// Using import.meta-derived __dirname breaks the bundled dist/server.js build,
// where __dirname is dist/ itself.
const PROJECT_ROOT = process.cwd();
const DIST_DIR = path.resolve(PROJECT_ROOT, 'dist');

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  assertAuthConfig();
  assertAdminConfig();

  // 1. Connect to database
  const connected = await connectDB();
  if (connected) {
    await seedDatabaseIfEmpty();
    await ensureConfiguredAdminAccount();
  } else {
    console.log('ℹ️ Server running with high-fidelity development seed catalog pending MONGODB_URI.');
  }

  // 2. Setup dev vs production static/Vite middleware
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(DIST_DIR));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // 3. Start listener
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ NOVARA COMMERCE live on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error in server bootstrap:', err);
  process.exitCode = 1;
});
