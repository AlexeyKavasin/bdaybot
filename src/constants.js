export const GET_ALL = 'GET_ALL';
export const GET_UPCOMING = 'GET_UPCOMING';
export const SET_NEW = 'SET_NEW';
export const TO_MAIN_MENU = 'TO_MAIN_MENU';

export const GET_ALL_REPLIES = [
    'Хмм. Хочешь посмотреть весь список дней рождений? Секундочку...',
    'Так значит хочешь посмотреть весь список дней рождений? Выполняю...',
    'Тебе нужен весь список дней рождений? Ок, сейчас будет...',
];

export const UPCOMING_REPLIES = [
    'Хмм. Хочешь посмотреть список ближайших дней рождений? Секундочку...',
    'Так значит хочешь посмотреть список ближайших дней рождений? Выполняю...',
    'Тебе нужен список ближайших дней рождений? Ок, сейчас будет...',
];

export const GREETING_TEXT = 'Привет. Я знаю дни рождения всех сотрудников команды школ.\n';
export const STRANGER_GREETING_TEXT = 'Привет. Я знаю дни рождения всех сотрудников команды школ, но похоже у тебя нет прав чтобы мной воспользоваться.';

export const ROOT_MARKUP = {
    inline_keyboard: [
        [
            {
                text: 'Посмотреть все',
                callback_data: GET_ALL,
            }
        ],
        [
          {
              text: 'Дни рождения на неделе',
              callback_data: GET_UPCOMING,
          }
        ],
        [
          {
              text: 'Добавить новые даты',
              callback_data: SET_NEW,
          }
        ],
    ] 
}

export const TO_MAIN_MENU_BTN = [
    {
        text: 'Назад в главное меню',
        callback_data: TO_MAIN_MENU,
    }
]