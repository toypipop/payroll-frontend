// toDateStr normalises whatever a DateField hands back into the YYYY-MM-DD the summary endpoints expect.
export const toDateStr = (date: Date | string) => {
    if (!date) return "";

    if (typeof date === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
        const parsed = new Date(date);
        if (Number.isNaN(parsed.getTime())) return "";
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, "0");
        const d = String(parsed.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

// monthToDate is the range both summary pages open on: the first of this month through today.
export const monthToDate = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return {
        from: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
        to: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    };
};
