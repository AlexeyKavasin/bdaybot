import { Scenes } from 'telegraf';
import { TO_MAIN_MENU, TO_MAIN_MENU_BTN } from '../constants.js';
import { appendSheetsData, getApiClient } from '../utils/googlesheetutils.js';
import { composeEmployeesText, prepareEmployeesInfo, dateIsValid, generateRandomId } from '../utils/utils.js';

const CONFIRM = 'CONFIRM';
const CONFIRM_MULTI = 'CONFIRM_MULTI';
const DECLINE = 'DECLINE';
const DECLINE_MULTI = 'DECLINE_MULTI';

export const SetBirthDayScene = new Scenes.WizardScene('setBirthDayScene',
    (ctx) => {
        ctx.reply(`
Хочешь добавить сотрудников?\n
Просто напиши имя и день рожения в числовом формате через запятую. Год указывать не надо. И да, это можно сделать списком.\n
Пример: "Иван, 01.01, Петр, 02.02, Мария, 03.03"
`, { reply_markup: { inline_keyboard: [TO_MAIN_MENU_BTN]}});
        return ctx.wizard.next();
    },
    async (ctx) => {
        const text = ctx.message && ctx.message.text;
        const goBack = Boolean(ctx?.callbackQuery?.data.includes(TO_MAIN_MENU));

        if (goBack || text === '/exit') {
            await ctx.deleteMessage();
            return ctx.scene.leave();
        }

        const employeesInfo = await prepareEmployeesInfo(text);

        if (!employeesInfo.length) {
            // validate input
            return;
        }

        if (employeesInfo.length === 1) {
            // single employee adding
            const { name, date } = employeesInfo[0];
            const isValid = await dateIsValid(date);

            // validate before writing to state
            if (!isValid) {
                ctx.reply('Что-то не так с датой. Корректный формат выглядит так: "01.01", "02.02" итд. Попробуйте еще раз.');
                return;
            }

            ctx.wizard.state.newEmployee = {
                name,
                date,
            };

            ctx.reply(`Давай проверим что все правильно.\n\nИмя: ${name}\nДень рождения: ${date}\n\nВсе так?`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Да', callback_data: CONFIRM }],
                        [{ text: 'Нет', callback_data: DECLINE }],
                        TO_MAIN_MENU_BTN
                    ] 
                }
            });

            return ctx.wizard.next();
        }

        if (employeesInfo.length > 1) {
            // list adding
            // compose text
            const allDatesValid = await employeesInfo.filter((emp) => dateIsValid(emp.date)).length === employeesInfo.length;

            if (!allDatesValid) {
                ctx.reply('Что-то не так с датой. Корректный формат выглядит так: "01.01", "02.02" итд. Попробуйте еще раз.');
                return;
            }

            const employeesText = composeEmployeesText(employeesInfo);

            ctx.wizard.state.newEmployees = {
                data: employeesInfo.map((e) => [e.name, e.date, '-', generateRandomId()]),
            };

            ctx.reply(employeesText, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Да', callback_data: CONFIRM_MULTI }],
                        [{ text: 'Нет', callback_data: DECLINE_MULTI }],
                        TO_MAIN_MENU_BTN
                    ] 
                }
            });

            return ctx.wizard.next();
        }
    },
    // all good ask for comment only on single employee
    async (ctx) => {
        const data = ctx?.callbackQuery?.data;
        const goBack = Boolean(ctx?.callbackQuery?.data.includes(TO_MAIN_MENU));

        if (goBack) {
            await ctx.deleteMessage();
            return ctx.scene.leave();
        }

        if (data === DECLINE || data === DECLINE_MULTI) {
            ctx.deleteMessage();
            ctx.wizard.selectStep(0);
            return ctx.wizard.steps[0](ctx);
        }

        if (data === CONFIRM_MULTI) {
            const apiClient = await getApiClient();
            await appendSheetsData(apiClient, { values: ctx.wizard.state.newEmployees.data });
            await ctx.reply('Ура! Новые сотрудники добавлены!');

            return ctx.scene.leave();
        }

        if (data === CONFIRM) {
            ctx.reply('К каждому человеку можно оставить комментарий для себя. Поставь прочерк, если нечего написать.')

            return ctx.wizard.next();
        }
    },
    // append in google sheet when single
    async (ctx) => {
        const comment = (ctx.message && ctx.message.text) || '';
        const goBack = Boolean(ctx?.callbackQuery?.data.includes(TO_MAIN_MENU));

        if (goBack || comment === '/exit') {
            await ctx.deleteMessage();
            return ctx.scene.leave();
        }

        const { name, date } = ctx.wizard.state.newEmployee;
        const apiClient = await getApiClient();

        await appendSheetsData(apiClient, { values: [[name, date, comment, generateRandomId()]] });
        await ctx.reply('Ура! Новый сотрудник добавлен!');

        return ctx.scene.leave();
    },
);
