import { differenceInDays, parseISO, isWeekend, addDays, format } from 'date-fns';

export function calculateWorkDays(startDate, endDate, holidays = []) {
    if (!startDate || !endDate) return 0;

    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

    if (end < start) return 0;

    const holidaySet = new Set(
        holidays.map(h => format(parseISO(h.date), 'yyyy-MM-dd'))
    );

    let workDays = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        if (!isWeekend(currentDate) && !holidaySet.has(dateStr)) {
            workDays++;
        }
        currentDate = addDays(currentDate, 1);
    }

    return workDays;
}

export function calculateSLA(startDate, endDate) {
    if (!startDate || !endDate) return 0;

    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

    return Math.max(0, differenceInDays(end, start));
}

export function calculateEffortWithFrozen(
    qualificationDate,
    endDate,
    holidays = [],
    frozenTimeMinutes = 0
) {
    const workDays = calculateWorkDays(qualificationDate, endDate, holidays);
    const frozenDays = Math.floor(frozenTimeMinutes / (60 * 24));

    return Math.max(0, workDays - frozenDays);
}
