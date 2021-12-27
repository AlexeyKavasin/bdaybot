import { Telegraf, Scenes, session } from 'telegraf';
import { SetBirthDayScene } from './scenes/setBirthDayScene.js';
import { EmployeesScene } from './scenes/employeesScene.js';
import {
    GET_ALL,
    GET_UPCOMING,
    GREETING_TEXT,
    ROOT_MARKUP,
    SET_NEW,
    STRANGER_GREETING_TEXT,
} from './constants.js';
import { hasPermissions } from './utils/utils.js';
import * as dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([ EmployeesScene, SetBirthDayScene ]);

bot.use(session());
bot.use(stage.middleware())

bot.start(async (ctx) => {
    if (hasPermissions(process.env.PERMISSIONS, ctx.chat.username)) {
        ctx.reply(GREETING_TEXT, { reply_markup: ROOT_MARKUP });
    } else {
        ctx.reply(STRANGER_GREETING_TEXT);
    }
});

bot.action(GET_ALL, async (ctx) => {
    if (hasPermissions(process.env.PERMISSIONS, ctx.chat.username)) {
        await ctx.deleteMessage();
        await ctx.scene.enter('employeesScene');
    }
});

bot.action(GET_UPCOMING, async (ctx) => {
    if (hasPermissions(process.env.PERMISSIONS, ctx.chat.username)) {
        console.log(ctx);
        await ctx.deleteMessage();
        await ctx.scene.enter('employeesScene');
    }
});

bot.action(SET_NEW, async (ctx) => {
    if (hasPermissions(process.env.PERMISSIONS, ctx.chat.username)) {
        await ctx.deleteMessage();
        await ctx.scene.enter('setBirthDayScene');
    }
});

bot.command('exit', async (ctx) => {
    await ctx.scene.leave();
});

bot.on('text', async (ctx) => {
    const msg = await ctx && ctx.update && ctx.update.text;

    if (msg && msg.includes(process.env.TRIGGER_NAME)) {
        const preparedText = msg.split(process.env.TRIGGER_NAME)[1];

        if (preparedText && preparedText.length) {
            ctx.telegram.sendMessage(ctx.update.chat_id, preparedText.trim());
        }
    }
})

EmployeesScene.leave((ctx) => {
    if (hasPermissions(process.env.PERMISSIONS, ctx.chat.username)) {
        ctx.reply(GREETING_TEXT, { reply_markup: ROOT_MARKUP });
    } else {
        ctx.reply(STRANGER_GREETING_TEXT);
    }
});

SetBirthDayScene.leave((ctx) => {
    if (hasPermissions(process.env.PERMISSIONS, ctx.chat.username)) {
        ctx.reply(GREETING_TEXT, { reply_markup: ROOT_MARKUP });
    } else {
        ctx.reply(STRANGER_GREETING_TEXT);
    }
});


if (process.env.IS_DEV) {
    bot.launch();
} else {
    bot.launch({
        webhook: {
          domain: `https://${process.env.HEROKU_URL}.herokuapp.com`,
          port: process.env.PORT,
        }
    });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
