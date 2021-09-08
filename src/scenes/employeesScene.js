import { Scenes } from 'telegraf';
import { GETLIST_REPLIES } from '../constants.js';
import { getApiClient, getSheetsData, updateSheetsData } from '../utils/googlesheetutils.js';

const colNames = {
    name: 'имя',
    bday: 'день рождения',
    comment: 'комментарий',
}

export const EmployeesScene = new Scenes.WizardScene('employeesScene',
    async (ctx) => {
        ctx.reply(GETLIST_REPLIES[Math.abs(Math.round(Math.random() * GETLIST_REPLIES.length - 1))]);

        const apiClient = await getApiClient();
        const [sheet] = await getSheetsData(apiClient);
        const employees = await sheet.data[0].rowData.reduce((acc, item, index) => {
            const name = item.values[0].formattedValue;
            const bDay = item.values[1].formattedValue;
            const comment = item.values[2].formattedValue;

            if (index > 0 && name && bDay) {
                return [...acc, {name, bDay, comment}];
            }

            return acc;
        }, []);
        const employeesKeyboard = await sheet.data[0].rowData.reduce((acc, item, index) => {
            const name = item.values[0].formattedValue;

            if (index > 0 && name) {
                return [...acc, [{text: name, callback_data: `employee-${index - 1}`}]];
            }

            return acc;
        }, []);

        ctx.reply("Вот весь список:", {
            reply_markup: {
                inline_keyboard: employeesKeyboard,
            }
        });
        ctx.wizard.state.employeesList = {
            employees,
        }

        return ctx.wizard.next();
    },
    (ctx) => {
        const text = ctx.message && ctx.message.text;

        if (text === '/exit' || text === '/help') {
            return ctx.scene.leave();
        }

        if (ctx.callbackQuery && ctx.callbackQuery.data.includes('employee')) {
            const employeeIndex = ctx.callbackQuery.data.split('-')[1];
            const employeeKeyboard =  [
                [
                    {
                        text: 'Редактировать имя',
                        callback_data: `edit-name-${employeeIndex}`
                    }
                ],
                [
                    {
                        text: 'Редактировать день рождения',
                        callback_data: `edit-bday-${employeeIndex}`
                    }
                ],
                [
                    {
                        text: 'Редактировать комментарий',
                        callback_data: `edit-comment-${employeeIndex}`
                    }
                ],
            ]

            const { name, bDay, comment } = ctx.wizard.state.employeesList.employees[employeeIndex];

            ctx.reply(`Имя: ${name}\nДень рождения: ${bDay}\nКомментарий: ${comment || ''}`, { reply_markup: { inline_keyboard: employeeKeyboard }})
        }

        if (ctx.callbackQuery && ctx.callbackQuery.data.includes('edit')) {
            const feature = ctx.callbackQuery.data.split('-')[1];
            const employeeIndex = ctx.callbackQuery.data.split('-')[2];

            ctx.wizard.state.employeesList.editingFeature = feature;
            ctx.wizard.state.employeesList.editingIndex = employeeIndex;

            ctx.reply(`Редактируем ${colNames[feature]} ${ctx.wizard.state.employeesList.employees[employeeIndex].name}. Введите новое значение`);

            return ctx.wizard.next(employeeIndex);
        }
    },
    async (ctx) => {
        const text = ctx.message && ctx.message.text;

        if (text === '/exit' || text === '/help') {
            return ctx.scene.leave();
        }

        const feature = ctx.wizard.state.employeesList.editingFeature;
        const employeeIndex = ctx.wizard.state.employeesList.editingIndex;
        const apiClient = await getApiClient();

        await updateSheetsData(
            apiClient,
            getRange(feature, employeeIndex),
            { values: [[text]] }
        );

        ctx.reply(`Ура! Отредактировали ${colNames[feature]}!`);

        return ctx.scene.leave();
    },
);

export function getRange(feature, employeeIndex) {
    let col;

    if (feature === 'name') {
        col = 'A';
    }

    if (feature === 'bday') {
        col = 'B';
    }

    if (feature === 'comment') {
        col = 'C';
    }

    return `${col}${employeeIndex + 2}`;
}
