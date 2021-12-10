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
import * as dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([ EmployeesScene, SetBirthDayScene ]);

bot.use(session());
bot.use(stage.middleware())

let permitted = false;

bot.start(async (ctx) => {
    const permissions = process.env.PERMISSIONS;

    permitted = Boolean(permissions && ctx.chat.username && permissions.includes(ctx.chat.username));

    if (permitted) {
        ctx.reply(GREETING_TEXT, { reply_markup: ROOT_MARKUP });
    } else {
        ctx.reply(STRANGER_GREETING_TEXT);
    }
});

bot.action(GET_ALL, async (ctx) => {
    if (permitted) {
        await ctx.deleteMessage();
        await ctx.scene.enter('employeesScene');
    }
});

bot.action(GET_UPCOMING, async (ctx) => {
    if (permitted) {
        await ctx.deleteMessage();
        await ctx.scene.enter('employeesScene');
    }
});

bot.action(SET_NEW, async (ctx) => {
    if (permitted) {
        await ctx.deleteMessage();
        await ctx.scene.enter('setBirthDayScene');
    }
});

bot.command('exit', async (ctx) => {
    await ctx.scene.leave();
});

EmployeesScene.leave((ctx) => {
    if (permitted) {
        ctx.reply(GREETING_TEXT, { reply_markup: ROOT_MARKUP });
    } else {
        ctx.reply(STRANGER_GREETING_TEXT);
    }
})

SetBirthDayScene.leave((ctx) => {
    if (permitted) {
        ctx.reply(GREETING_TEXT, { reply_markup: ROOT_MARKUP });
    } else {
        ctx.reply(STRANGER_GREETING_TEXT);
    }
})

if (process.env.IS_DEV) {
    bot.launch()
} else {
    bot.launch({
        webhook: {
          domain: 'https://schl-bday-bot.herokuapp.com',
          port: process.env.PORT,
        }
    });
}

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
