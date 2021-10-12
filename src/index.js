import { Telegraf, Scenes, session } from 'telegraf';
import { SetBirthDayScene } from './scenes/setBirthDayScene.js';
import { EmployeesScene } from './scenes/employeesScene.js';
import { SetCronScene } from './scenes/cronScene.js';
import * as dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([ EmployeesScene, SetBirthDayScene, SetCronScene ]);

bot.use(session());
bot.use(stage.middleware())

const GREETING_TEXT = 'Привет. Я бот, знающий дни рождения всех сотрудников команды школ.';

bot.start((ctx) => {
    ctx.reply(GREETING_TEXT);
});

bot.command('getlist', async (ctx) => {
    await ctx.scene.enter('employeesScene');
});

bot.command('set', async (ctx) => {
    await ctx.scene.enter('setBirthDayScene');
});

bot.command('remind', async (ctx) => {
    await ctx.scene.enter('setCronScene');
});

bot.command('exit', async (ctx) => {
    await ctx.scene.leave();
});

bot.command('help', async (ctx) => {
    ctx.reply('/getlist - список сотрудников с возможностью правки данных\n/set - добавить нового сотрудника\n/remind - установить напоминалку\n/exit - выход к начальному состоянию');
})

EmployeesScene.leave((ctx) => {
    ctx.reply(GREETING_TEXT);
})

SetBirthDayScene.leave((ctx) => {
    ctx.reply(GREETING_TEXT);
})

SetCronScene.leave((ctx) => {
    ctx.reply(GREETING_TEXT);
})

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
