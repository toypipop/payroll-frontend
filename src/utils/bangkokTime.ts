// Business timezone is fixed to Asia/Bangkok (UTC+7, no DST) — never rely on the viewer's browser timezone, which may not be Bangkok.
const BANGKOK_OFFSET_MINUTES = 7 * 60;

// What the API may hand back for a time: ISO text, a bare "HH:MM", a Date, or nothing at all.
export type TimeInput = string | Date | null | undefined;

export const toBangkokHM = (date: Date) => {
    const totalMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + BANGKOK_OFFSET_MINUTES;
    const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    return { hours: Math.floor(wrapped / 60), minutes: wrapped % 60 };
};

// formatTime reads a stored value into the "HH:MM" a TimeField expects, defaulting to 09:00 when there is nothing to read.
export const formatTime = (timeValue: TimeInput) => {
    if (!timeValue) return "09:00";
    if (typeof timeValue === 'string') {
        if (timeValue.includes(':') && !timeValue.includes('T')) {
            return timeValue.substring(0, 5);
        }
        const date = new Date(timeValue);
        if (!Number.isNaN(date.getTime())) {
            const { hours, minutes } = toBangkokHM(date);
            return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
        }
    }
    return "09:00";
};

// formatDisplayTime renders a stored value as 12-hour text for the table.
export const formatDisplayTime = (timeValue: TimeInput) => {
    if (!timeValue) return "-";
    if (typeof timeValue === 'string') {
        if (timeValue.includes(':') && !timeValue.includes('T')) {
            const [h, m] = timeValue.split(':');
            const hour = parseInt(h);
            const ampm = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
            return `${displayHour}:${m} ${ampm}`;
        }
        const date = new Date(timeValue);
        if (!Number.isNaN(date.getTime())) {
            const { hours, minutes } = toBangkokHM(date);
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
            return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
        }
    }
    return "-";
};

// bangkokDateKey renders the calendar date the value falls on in the business timezone, as "YYYY-MM-DD".
export const bangkokDateKey = (timeValue: TimeInput) => {
    if (!timeValue) return "";
    const date = timeValue instanceof Date ? timeValue : new Date(timeValue);
    if (Number.isNaN(date.getTime())) return "";
    const shifted = new Date(date.getTime() + BANGKOK_OFFSET_MINUTES * 60 * 1000);
    return shifted.toISOString().split("T")[0];
};

// bangkokMinutes turns a value into minutes since midnight in the business timezone, for sorting a time column.
export const bangkokMinutes = (timeValue: TimeInput) => {
    if (!timeValue) return -1;
    const date = timeValue instanceof Date ? timeValue : new Date(timeValue);
    if (Number.isNaN(date.getTime())) return -1;
    const { hours, minutes } = toBangkokHM(date);
    return hours * 60 + minutes;
};

// A datetime-local field holds naive "YYYY-MM-DDTHH:MM" text. These two convert between that text and the
// instant the API stores, always reading it as Bangkok wall clock rather than the viewer's own timezone.
export const bangkokLocalToISO = (value: string | null | undefined) => {
    if (!value) return null;
    const date = new Date(`${value.length === 16 ? value : value.slice(0, 16)}:00+07:00`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const isoToBangkokLocal = (timeValue: TimeInput) => {
    if (!timeValue) return "";
    const key = bangkokDateKey(timeValue);
    if (!key) return "";
    const { hours, minutes } = toBangkokHM(timeValue instanceof Date ? timeValue : new Date(timeValue));
    return `${key}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

// endOfBangkokMonth works only with a calendar date key, avoiding the viewer's local timezone entirely.
export const endOfBangkokMonth = (dateKey: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
    if (!match) return "";

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1) return "";

    const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (day > daysInMonth) return "";
    return `${match[1]}-${match[2]}-${String(daysInMonth).padStart(2, "0")}`;
};

// Inclusive span of two real Bangkok calendar dates; invalid input returns null.
export const bangkokCalendarDays = (start: string, end: string): number | null => {
    if (!endOfBangkokMonth(start) || !endOfBangkokMonth(end)) return null;
    const startISO = bangkokLocalToISO(start + "T00:00");
    const endISO = bangkokLocalToISO(end + "T00:00");
    if (!startISO || !endISO) return null;
    return (Date.parse(endISO) - Date.parse(startISO)) / 86400000 + 1;
};
