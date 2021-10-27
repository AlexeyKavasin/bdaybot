import { Scenes } from 'telegraf';
import cron from 'node-cron';
import { getApiClient, getSheetsData } from '../utils/googlesheetutils.js';
import { getEmployeesData, getEmployeesWithBirthdaysThisWeek } from '../utils/utils.js';

const SUBSCRIBE = 'SUBSCRIBE';
const UNSUBSCRIBE = 'UNSUBSCRIBE';
const EXIT = 'EXIT';

const cronTaskMap = {};

export const SetCronScene = new Scenes.WizardScene(
  "setCronScene",
  (ctx) => {
    ctx.reply('Установим напоминалку?', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Предупреждать за неделю',
                        callback_data: SUBSCRIBE,
                    }
                ],
                [
                  {
                      text: 'Отменить напоминалку',
                      callback_data: UNSUBSCRIBE,
                  }
                ],
                [
                    {
                        text: 'Назад',
                        callback_data: EXIT,
                    }
                ],
            ] 
        }
    });
    return ctx.wizard.next();
  },
  async (ctx) => {
    const data = ctx?.callbackQuery?.data;

    if (data === EXIT) {
      return ctx.scene.leave();
    }

    if (data === SUBSCRIBE) {
      // every hour
      if (cronTaskMap[`week_${ctx.chat.username}`]) {
        await ctx.reply('Напоминалка уже была установлена!');

        return ctx.scene.leave();
      }

      // 0 * * * * - every hour
      // * * * * * - every minute
      // 0 10 * * * - every day 10:00
      // 0 13 * * FRI - every friday 13:00
      const task = cron.schedule('0 13 * * FRI', async () => {
        const apiClient = await getApiClient();
        const [sheet] = await getSheetsData(apiClient);
        const employeesData = await getEmployeesData(sheet.data[0].rowData);
        const hasBirthdays = await getEmployeesWithBirthdaysThisWeek(employeesData);

        if (hasBirthdays.length) {
          const employeesStr = hasBirthdays.reduce((acc, employee) => {
            if (employee) {
              return `${acc}\nИмя: ${employee.name}\nДень рождения: ${employee.bDay}\nКомментарий: ${employee.comment}\n`
            }

            return acc;
          }, '');

          ctx.reply(`🥳 🎉 🥳 🎉 🥳\n\nУра! Похоже что кое у кого скоро день рождения:\n ${employeesStr}`);
        }
      }, { scheduled: false, timezone: 'Europe/Moscow' });
      cronTaskMap[`week_${ctx.chat.username}`] = task;
      cronTaskMap[`week_${ctx.chat.username}`].start();
      await ctx.reply('Ура! Напоминалка установлена!');

      return ctx.scene.leave();
    }

    if (data === UNSUBSCRIBE) {
      if (cronTaskMap[`week_${ctx.chat.username}`]) {
        cronTaskMap[`week_${ctx.chat.username}`].stop();
        await ctx.reply('Ура! Напоминалка отменена!');
      }

      return ctx.scene.leave();
    }
  }
);
