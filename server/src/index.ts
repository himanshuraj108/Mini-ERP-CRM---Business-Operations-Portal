import app from './app';
import { config } from './config/env';
import pool from './config/database';

async function startServer(): Promise<void> {
  try {
    const client = await pool.connect();
    client.release();
    console.log('Database connection established');

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
