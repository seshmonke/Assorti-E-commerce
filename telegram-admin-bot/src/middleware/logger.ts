import { Context, NextFunction } from 'grammy';
import { logger } from '../utils/logger';

export async function loggingMiddleware(ctx: Context, next: NextFunction): Promise<void> {
  const start = Date.now();
  const update = ctx.update;

  const userId = ctx.from?.id;
  const username = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name || 'unknown';

  let updateType: string;
  let updateDetails: string;

  if (update.message) {
    updateType = 'message';
    updateDetails = update.message.text
      ? `"${update.message.text}"`
      : `[${update.message.photo ? 'photo' : update.message.document ? 'document' : 'non-text'}]`;
  } else if (update.callback_query) {
    updateType = 'callback_query';
    updateDetails = `data: "${update.callback_query.data ?? 'empty'}"`;
  } else if (update.inline_query) {
    updateType = 'inline_query';
    updateDetails = `query: "${update.inline_query.query}"`;
  } else {
    updateType = 'unknown';
    updateDetails = '';
  }

  logger.debug(`[${updateType}] ${username} (id:${userId}) → ${updateDetails}`, {
    updateId: update.update_id,
  });

  await next();

  const ms = Date.now() - start;
  logger.debug(`[${updateType}] processed`, {
    updateId: update.update_id,
    user: username,
    duration: `${ms}ms`,
  });
}
