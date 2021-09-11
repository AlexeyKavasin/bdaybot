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
