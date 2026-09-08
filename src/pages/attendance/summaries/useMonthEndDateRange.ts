import { useState } from "react";
import { endOfBangkokMonth } from "../../../utils/bangkokTime";

interface MonthEndDateRangeOptions {
    setFromDate: (value: string) => void;
    toDate: string;
    setToDate: (value: string) => void;
}

// Keeps a report's To date in sync with From only while the system owns that value.
export const useMonthEndDateRange = ({ setFromDate, toDate, setToDate }: MonthEndDateRangeOptions) => {
    // useAttendanceSummary supplies the initial month-to-date range, so its To value is system-owned
    // until the user explicitly chooses a different date.
    const [toDateIsAutoFilled, setToDateIsAutoFilled] = useState(true);

    const handleFromDateChange = (nextFromDate: string) => {
        setFromDate(nextFromDate);
        if (!nextFromDate) {
            if (toDateIsAutoFilled) setToDate("");
            setToDateIsAutoFilled(false);
            return;
        }
        if (!toDate || toDateIsAutoFilled) {
            setToDate(endOfBangkokMonth(nextFromDate));
            setToDateIsAutoFilled(true);
        }
    };

    const handleToDateChange = (nextToDate: string) => {
        setToDate(nextToDate);
        setToDateIsAutoFilled(false);
    };

    return { handleFromDateChange, handleToDateChange };
};
