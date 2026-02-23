import { type Conversation, type ConversationFlavor } from '@grammyjs/conversations';
import { type Context } from 'grammy';
import { mainMenuKeyboard, backKeyboard } from '../keyboards/mainMenu';
import { editProductById } from './editProduct';

export type MyContext = ConversationFlavor<Context>;
type MyConversation = Conversation<MyContext, MyContext>;

export async function findProductConversation(
  conversation: MyConversation,
  ctx: MyContext,
): Promise<void> {
  await ctx.reply('Введите ID товара (UUID):', { reply_markup: backKeyboard });

  while (true) {
    const idCtx = await conversation.wait();
    const text = idCtx.message?.text?.trim();
    if (!text) continue;

    if (text === '⬅️ Назад' || text === '🏠 Главное меню') {
      await ctx.reply('Главное меню', { reply_markup: mainMenuKeyboard });
      return;
    }

    const result = await editProductById(conversation, ctx, text);

    if (result === 'done') {
      return;
    }

    // result === 'back' — просим ввести другой ID
    await ctx.reply('Введите ID товара (UUID):', { reply_markup: backKeyboard });
  }
}
