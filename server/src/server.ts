import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      brand: 'The Bombay Reserve',
    },
    `[The Bombay Reserve Server] Running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`
  );
});

export default server;
