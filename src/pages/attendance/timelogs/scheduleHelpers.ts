import { toBangkokHM, isoToBangkokLocal } from "../../../utils/bangkokTime";
import type { TimeInput } from "../../../utils/bangkokTime";

// A wall-clock time of day, as the schedule config and the bulk modal pass it around.
export interface HourMinute {
    hour: number;
    min: number;
}

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

export const toLocalDateTimeValue = (date: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// The stored value is an instant; the field wants the wall clock it represents in the business timezone.
export const parseToLocalDateTimeValue = (value: TimeInput) => isoToBangkokLocal(value);

export const parseTimeFromConfig = (timeValue: TimeInput, defaultHour: number, defaultMin: number): HourMinute => {
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
            const { hours, minutes } = toBangkokHM(date);
            return { hour: hours, min: minutes };
        }
    }

    if (timeValue instanceof Date && !Number.isNaN(timeValue.getTime())) {
        return { hour: timeValue.getHours(), min: timeValue.getMinutes() };
    }

    return { hour: defaultHour, min: defaultMin };
};

export const minutesFromTime = ({ hour, min }: HourMinute) => (hour * 60) + min;

export const formatHHMM = ({ hour, min }: HourMinute) => `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

export const buildDateWithTime = (baseDate: Date | string, hour: number, min: number) => {
    const date = new Date(baseDate);
    date.setHours(hour, min, 0, 0);
    return date;
};
