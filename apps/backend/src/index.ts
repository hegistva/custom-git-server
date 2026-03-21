import { env } from './lib/env';
import { buildApp } from './app';

async function start(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({
      port: env.port,
      host: '0.0.0.0',
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void start();
