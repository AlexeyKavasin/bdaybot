import { Scenes } from 'telegraf';
import { appendSheetsData, getApiClient } from '../utils/googlesheetutils.js';

const CONFIRM = 'CONFIRM';
const DECLINE = 'DECLINE';

export const SetBirthDayScene = new Scenes.WizardScene('setBirthDayScene',
    (ctx) => {
        ctx.reply('Хочешь добавить нового сотрудника в список?\nПросто напиши его имя и день рожения в числовом формате через запятую. Год указывать не надо.\nПример: "Иван, 01.01."');
        return ctx.wizard.next();
    },
    (ctx) => {
        const [name, date] = ctx.message?.text?.split(',');

        // validate before writing to state

        ctx.wizard.state.newUser = {
            name,
            date,
        };

        ctx.reply(`Давай проверим что все правильно.\n\nИмя: ${name}\nДень рождения: ${date}\n\nВсе так?`, {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Да',
                            callback_data: CONFIRM,
                        }
                    ],
                    [
                        {
                            text: 'Нет',
                            callback_data: DECLINE,
                        }
                    ],
                ] 
            }
        });
        return ctx.wizard.next();
    },
    // append in google sheet
    async (ctx) => {
        const data = ctx?.callbackQuery?.data;

        if (data === CONFIRM) {
            const { name, date } = ctx.wizard.state.newUser;
            const apiClient = await getApiClient();

            await appendSheetsData(apiClient, { values: [[name, date]] });
            ctx.reply('Ура! Новый сотрудник добавлен!');

            return ctx.scene.leave();
        }

        if (data === DECLINE) {
            ctx.deleteMessage();
            ctx.wizard.selectStep(0);
            return ctx.wizard.steps[0](ctx);
        }
    },
);
