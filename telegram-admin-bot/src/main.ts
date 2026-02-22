import { startBot } from "./bot";
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    logger.info('Application starting...');
    await startBot();
  } catch (error) {
    logger.error('Fatal error', { error });
    process.exit(1);
  }
}

main();
