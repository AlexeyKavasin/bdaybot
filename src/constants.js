import * as fs from 'fs';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const CREDENTIALS_PATH = './credentials.json';

export const CREDS = await readFile(CREDENTIALS_PATH).catch(err => console.log('Error loading credentials:', err));

export const GETLIST_REPLIES = [
    'Хмм. Хочешь посмотреть весь список дней рождений? Секундочку...',
    'Так значит хочешь посмотреть весь список дней рождений? Выполняю...',
    'Тебе нужен весь список дней рождений? Ок, сейчас будет...',
];

export const GREETING_TEXT = 'Привет. Я знаю дни рождения всех сотрудников команды школ.';
export const STRANGER_GREETING_TEXT = 'Привет. Я знаю дни рождения всех сотрудников команды школ, но похоже у тебя нет прав чтобы мной воспользоваться.';
