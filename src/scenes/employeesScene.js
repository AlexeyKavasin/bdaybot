import { Scenes } from 'telegraf';
import { GETLIST_REPLIES } from '../constants.js';
import { deleteRow, getApiClient, getSheetsData, updateSheetsData } from '../utils/googlesheetutils.js';
import { getEmployeesData, getRange } from '../utils/utils.js';

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
        const employeesData = await getEmployeesData(sheet.data[0].rowData);
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
            employees: employeesData,
        }

        return ctx.wizard.next();
    },
    async (ctx) => {
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
                [
                    {
                        text: 'Удалить сотрудника',
                        callback_data: `delete-${employeeIndex}`
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

            return ctx.wizard.next();
        }

        if (ctx.callbackQuery && ctx.callbackQuery.data.includes('delete')) {
            // удаление сотрудника
            const employeeIndex = ctx.callbackQuery.data.split('-')[1];

            await ctx.reply('Секундочку. Удаляем сотрудника...');

            const apiClient = await getApiClient();
            await deleteRow(apiClient, {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                dimension: 'ROWS',
                                startIndex: +employeeIndex + 1,
                                endIndex: +employeeIndex + 2,
                            }
                        }
                    }
                ],
            });

            await ctx.reply('Сотрудник удален :(');

            return ctx.scene.leave();
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

        await ctx.reply(`Ура! Отредактировали ${colNames[feature]}!`);

        return ctx.scene.leave();
    },
);
