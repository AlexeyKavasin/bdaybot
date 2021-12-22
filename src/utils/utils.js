import { GET_ALL_REPLIES, UPCOMING_REPLIES, EMPLOYEES_PER_PAGE } from '../constants.js';

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

export function getRange(feature, employeeId, allEmployees) {
    let col;

    const employeeIndex = allEmployees.findIndex((emp) => emp.id === employeeId);

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

export function getEmployeesData(data) {
    const res = data.reduce((acc, item, index) => {
        const name = item.values[0].formattedValue;
        const bDay = item.values[1].formattedValue;
        const comment = item.values[2].formattedValue;
        const id = item.values[3].formattedValue;
    
        if (index > 0 && name && bDay) {
            return [...acc, {name, bDay, comment, id}];
        }
    
        return acc;
    }, []);

    return res;
}

export function getPaginationBtns(data, currentPage) {
    const pagesAmount = Math.ceil(data.length / EMPLOYEES_PER_PAGE);
    const pages = [];

    if (pagesAmount <= 1) {
        return [];
    }

    for (let i = 1; i <= pagesAmount; i++) {
        pages.push({
            text: i === currentPage? `* ${i} *` : i,
            callback_data: `PAGE-${i}`,
        })
    }

    return [pages];
}

export function getSliceStart(currPage) {
    if (currPage === 1) {
        return 0;
    }

    return (currPage - 1) * EMPLOYEES_PER_PAGE;
}

export function getSliceEnd(currPage) {
    if (currPage === 1) {
        return EMPLOYEES_PER_PAGE;
    }

    return currPage * EMPLOYEES_PER_PAGE;
}

export function getEmployeesKeyBoard(employeesData, fullList = true, currentPage = 1) {
    const copied = JSON.parse(JSON.stringify(employeesData));
    const preparedEmployees = fullList
        ? copied.sort(sortDatesAscending)
        : getEmployeesWithBirthdaysThisWeek(copied).sort(sortDatesAscending);

    const employeesBtns = preparedEmployees.reduce((acc, item) => {
        const { bDay, name, id } = item;

        if (name) {
            return [...acc, [{text: `${name} ${bDay}`, callback_data: `employee-${id}`}]];
        }

        return acc;
    }, []);
    const paginationBtns = getPaginationBtns(preparedEmployees, currentPage);
    const sliceStart = getSliceStart(currentPage);
    const sliceEnd = getSliceEnd(currentPage);

    return [
        ...employeesBtns.slice(sliceStart, sliceEnd),
        ...paginationBtns,
    ];
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

export function generateRandomId() {
    return Math.random().toString(16).slice(2);
}

export function hasPermissions(permissions, name) {
    return Boolean(permissions && name && permissions.includes(name));
}
