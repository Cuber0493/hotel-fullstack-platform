import { startWorker } from './jobs/worker.js';
import { logger } from './lib/logger.js';

logger.info('================================================================');
logger.info('   THE BOMBAY RESERVE - BACKGROUND QUEUE WORKER PROCESS         ');
logger.info('================================================================');

const worker = startWorker();

const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully stopping BullMQ queue worker...`);
  if (worker) {
    await worker.close();
  }
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Prevent worker process from exiting prematurely
setInterval(() => {}, 60000);
