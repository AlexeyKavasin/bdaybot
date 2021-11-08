import { Scenes } from 'telegraf';
import { deleteRow, getApiClient, getSheetsData, updateSheetsData } from '../utils/googlesheetutils.js';
import {
    getEmployeesData, getEmployeesKeyBoard, getEmployeesReplyText, getRange, sortDatesAscending,
} from '../utils/utils.js';
import { GET_ALL, TO_MAIN_MENU, TO_MAIN_MENU_BTN } from '../constants.js';

const colNames = {
    name: 'имя',
    bday: 'день рождения',
    comment: 'комментарий',
}

export const EmployeesScene = new Scenes.WizardScene('employeesScene',
    async (ctx) => {
        const fullList = Boolean(ctx?.callbackQuery?.data.includes(GET_ALL));
        ctx.reply(getEmployeesReplyText(fullList));

        const apiClient = await getApiClient().catch((err) => console.log(`Api Client Error: ${err}`));
        const [sheet] = await getSheetsData(apiClient);
        const employeesData = await getEmployeesData(sheet.data[0].rowData, fullList).sort(sortDatesAscending);
        const employeesKeyboard = await getEmployeesKeyBoard(employeesData);

        if (employeesData && employeesData.length) {
            ctx.reply("Вот список:", {
                reply_markup: {
                    inline_keyboard: [ ...employeesKeyboard, TO_MAIN_MENU_BTN],
                }
            });
    
            ctx.wizard.state.employeesList = {
                employees: employeesData,
            }

            return ctx.wizard.next();
        } else {
            ctx.reply('В ближайшую неделю никто не празднует день рождения :(', {
                    reply_markup: { inline_keyboard: [TO_MAIN_MENU_BTN] }
                }
            );

            return ctx.scene.leave();
        }
    },
    async (ctx) => {
        const text = ctx.message && ctx.message.text;
        const goBack = Boolean(ctx?.callbackQuery?.data.includes(TO_MAIN_MENU));

        if (goBack || text === '/exit') {
            await ctx.deleteMessage();
            return ctx.scene.leave();
        }

        if (ctx.callbackQuery && ctx.callbackQuery.data.includes('employee')) {
            await ctx.deleteMessage();
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
                TO_MAIN_MENU_BTN,
            ]

            const { name, bDay, comment } = ctx.wizard.state.employeesList.employees[employeeIndex];

            ctx.reply(`Имя: ${name}\nДень рождения: ${bDay}\nКомментарий: ${comment || ''}`, { reply_markup: { inline_keyboard: employeeKeyboard }})
        }

        if (ctx.callbackQuery && ctx.callbackQuery.data.includes('edit')) {
            await ctx.deleteMessage();
            const feature = ctx.callbackQuery.data.split('-')[1];
            const employeeIndex = ctx.callbackQuery.data.split('-')[2];
            ctx.wizard.state.employeesList.editingFeature = feature;
            ctx.wizard.state.employeesList.editingIndex = employeeIndex;

            ctx.reply(`Редактируем ${colNames[feature]} ${ctx.wizard.state.employeesList.employees[employeeIndex].name}. Введите новое значение`, {
                reply_markup: { inline_keyboard: [TO_MAIN_MENU_BTN]}
            });

            return ctx.wizard.next();
        }

        if (ctx.callbackQuery && ctx.callbackQuery.data.includes('delete')) {
            await ctx.deleteMessage();
            // удаление сотрудника
            const employeeIndex = ctx.callbackQuery.data.split('-')[1];

            await ctx.reply('Секундочку. Удаляем сотрудника...');

            const apiClient = await getApiClient().catch((err) => console.log(`Api Client Error: ${err}`));
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
        const goBack = Boolean(ctx?.callbackQuery?.data.includes(TO_MAIN_MENU));

        if (goBack || text === '/exit') {
            await ctx.deleteMessage();
            return ctx.scene.leave();
        }

        const feature = ctx.wizard.state.employeesList.editingFeature;
        const employeeIndex = ctx.wizard.state.employeesList.editingIndex;
        const apiClient = await getApiClient().catch((err) => console.log(`Api Client Error: ${err}`));

        await updateSheetsData(apiClient, getRange(feature, employeeIndex), { values: [[text]] });

        await ctx.reply(`Ура! Отредактировали ${colNames[feature]}!`);

        return ctx.scene.leave();
    },
);
