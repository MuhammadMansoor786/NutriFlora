import app, { initializeDatabase } from './src/server/app.ts';

const PORT = Number(process.env.PORT) || 3000;

if (!process.env.NETLIFY && !process.env.VERCEL && process.env.NODE_ENV !== 'production') {
  async function startServer() {
    await initializeDatabase();

    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  }

  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}
