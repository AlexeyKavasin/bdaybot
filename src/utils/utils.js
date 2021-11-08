import { GET_ALL_REPLIES, UPCOMING_REPLIES } from '../constants.js';

export function prepareEmployeesInfo(str) {
    if (!str || !str.length) {
        return [];
    }

    return str
    .split(',')
    .map((item, ind, arr) => ind % 2 !== 0 ? { 
        name: arr[ind-1].trim(),
        date: arr[ind].replace(/\s/g, '')
    } : null)
    .filter((i) => i !== null)
}

export function composeEmployeesText(data) {
    const namesAndDates = data.reduce((acc, item, index) => {
        const divider = index >= data.length - 1 ? '' : ',\n';

        return `${acc}${item.name}: ${item.date}${divider}`;
    }, '')

    return `Давай проверим что все правильно.\n\n${namesAndDates}\n\nВсе так?`;
}

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

    return `${col}${Number(employeeIndex) + 2}`;
}

export function getEmployeesData(data, fullList = true) {
    const res = data.reduce((acc, item, index) => {
        const name = item.values[0].formattedValue;
        const bDay = item.values[1].formattedValue;
        const comment = item.values[2].formattedValue;
    
        if (index > 0 && name && bDay) {
            return [...acc, {name, bDay, comment}];
        }
    
        return acc;
    }, []);

    return fullList ? res : getEmployeesWithBirthdaysThisWeek(res);
}

export function getEmployeesKeyBoard(employeesData) {
    return employeesData.reduce((acc, item, index) => {
        const { bDay, name } = item;

        if (name) {
            return [...acc, [{text: `${name} ${bDay}`, callback_data: `employee-${index}`}]];
        }

        return acc;
    }, []);
}

const DAYS_IN_MONTHS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export function getDayRange(currentDay, currentMonth) {
    const range = [];
    let firstDayOfNewMonth = 1;
    let firstMonth = 1;

    for (let i = 0, j = 0; i <= 7; i++) {
        let day;
        let month;

        if (currentDay + i > DAYS_IN_MONTHS[currentMonth]) {
          day = firstDayOfNewMonth + j;
          month = currentMonth + 2 > 12 ? firstMonth : currentMonth + 2;
          j++;
        } else {
          day = currentDay + i;
          month = currentMonth + 1;
        }


        range.push(`${day < 10 ? `0${day}` : day}.${month < 10 ? `0${month}` : month}`);
    }

    return range;
}

export function getEmployeesWithBirthdaysThisWeek(data) {
    const dayRange = getDayRange(new Date().getDate(), new Date().getMonth());

    return data.filter((e) => dayRange.includes(e.bDay));
}

export function isDayAndMonthValid(day, month) {
    if (!day || !month) {
        return false;
    }

    return day <= DAYS_IN_MONTHS[month - 1];
}

export function dateIsValid(date) {
    if (!date || typeof date !== 'string' || date.split('.').length !== 2) {
        return false;
    }

    const [day, month] = date.split('.');

    if (!day || !month || day < 0 || day > 31 || month > 12 || month < 0) {
        return false;
    }

    return isDayAndMonthValid(day, month);
}

export function sortDatesAscending(a, b) {
    const birthdayA = a.bDay;
    const birthdayB = b.bDay;

    const [dayA, monthA] = birthdayA.split('.');
    const [dayB, monthB] = birthdayB.split('.');
    
    // 2020 - leap year
    const dateA = new Date(2020, monthA - 1, dayA);
    const dateB = new Date(2020, monthB - 1, dayB);
    
    if (dateA > dateB) {
        return 1;
    }
    
    if (dateA < dateB) {
        return -1;
    }
    
    return 0;
}

export function getEmployeesReplyText(fullList) {
    if (fullList) {
        return GET_ALL_REPLIES[Math.abs(Math.round(Math.random() * GET_ALL_REPLIES.length - 1))];
    }

    return UPCOMING_REPLIES[Math.abs(Math.round(Math.random() * UPCOMING_REPLIES.length - 1))];
}
