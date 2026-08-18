// Business timezone is fixed to Asia/Bangkok (UTC+7, no DST) — never rely on the viewer's browser timezone, which may not be Bangkok.
const BANGKOK_OFFSET_MINUTES = 7 * 60;

export const toBangkokHM = (date) => {
    const totalMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + BANGKOK_OFFSET_MINUTES;
    const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
    return { hours: Math.floor(wrapped / 60), minutes: wrapped % 60 };
};

// formatTime reads a stored value into the "HH:MM" a TimeField expects, defaulting to 09:00 when there is nothing to read.
export const formatTime = (timeValue) => {
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
export const formatDisplayTime = (timeValue) => {
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
