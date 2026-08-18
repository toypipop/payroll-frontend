// Pure date/time helpers shared by the time-log page and its bulk-add modal; nothing here touches React.
export const WEEKDAY_OPTIONS = [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
    { value: 0, label: "Sun" },
];

export const toLocalDateTimeValue = (date) => {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const parseToLocalDateTimeValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return toLocalDateTimeValue(date);
};

export const parseTimeFromConfig = (timeValue, defaultHour, defaultMin) => {
    if (!timeValue) return { hour: defaultHour, min: defaultMin };

    if (typeof timeValue === "string") {
        if (timeValue.includes(":") && !timeValue.includes("T")) {
            const [hour, min] = timeValue.split(":").map(Number);
            if (Number.isFinite(hour) && Number.isFinite(min)) {
                return { hour, min };
            }
        }

        const date = new Date(timeValue);
        if (!Number.isNaN(date.getTime())) {
            return { hour: date.getHours(), min: date.getMinutes() };
        }
    }

    if (timeValue instanceof Date && !Number.isNaN(timeValue.getTime())) {
        return { hour: timeValue.getHours(), min: timeValue.getMinutes() };
    }

    return { hour: defaultHour, min: defaultMin };
};

export const minutesFromTime = ({ hour, min }) => (hour * 60) + min;

export const formatHHMM = ({ hour, min }) => `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

export const buildDateWithTime = (baseDate, hour, min) => {
    const date = new Date(baseDate);
    date.setHours(hour, min, 0, 0);
    return date;
};
