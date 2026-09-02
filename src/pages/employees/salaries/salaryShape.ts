// The salary rows come back from several shapes of payload, so every read goes through one of these getters instead of guessing at the call site. Nothing here touches React.
//
// The payloads are deliberately typed as a bag of unknown keys: that is exactly the situation these getters
// exist for, and naming a single interface here would claim a certainty the endpoints do not offer.
// `object` rather than an index-signature type, so a page can pass a typed row straight in.
export type SalaryPayload = object | null | undefined;

// read pulls the first key that carries a value, in the order the caller listed them.
const read = (source: SalaryPayload, ...keys: string[]): unknown => {
    if (!source) return undefined;
    const bag = source as Record<string, unknown>;
    for (const key of keys) {
        const value = bag[key];
        if (value !== undefined && value !== null) return value;
    }
    return undefined;
};

export const getEmployeeId = (emp: SalaryPayload) => {
    const direct = read(emp, "ID", "id", "employees_id", "employee_id");
    if (direct !== undefined) return direct as string | number;
    const nested = read(emp, "employees") as Record<string, unknown> | null | undefined;
    return (nested?.id as string | number | undefined) ?? null;
};

export const getSalaryStructure = (emp: SalaryPayload) =>
    (read(emp, "salaries_structure", "salary_structure", "salaries") ?? null) as SalaryPayload | SalaryPayload[];

export const getSalaryRecordId = (salary: SalaryPayload, row?: SalaryPayload) =>
    Number(
        read(salary, "id", "ID", "salary_id", "SalaryID", "salaries_id", "salaries_structure_id") ??
            read(row, "salary_id", "SalaryID", "salaries_id", "salaries_structure_id") ??
            0,
    );

export const getSalaryBaseAmount = (salary: SalaryPayload, row?: SalaryPayload) =>
    Number(
        read(salary, "base_salaries", "base_salary", "BaseSalaries", "BaseSalary") ??
            read(row, "base_salaries", "base_salary", "BaseSalaries", "BaseSalary") ??
            0,
    );

export const getSalaryEffectiveDate = (salary: SalaryPayload, row?: SalaryPayload) =>
    String(
        read(salary, "effective_date", "effectiveDate", "EffectiveDate") ??
            read(row, "effective_date", "effectiveDate", "EffectiveDate") ??
            "",
    );

export const getSalaryDeletedAt = (salary: SalaryPayload, row?: SalaryPayload): unknown =>
    read(salary, "deleted_at", "deletedAt", "DeletedAt") ??
    read(row, "deleted_at", "deletedAt", "DeletedAt");

export const getSalaryStructures = (emp: SalaryPayload): SalaryPayload[] => {
    const direct = getSalaryStructure(emp);
    if (Array.isArray(direct)) return direct;
    if (direct && typeof direct === "object") return [direct];

    const fromArray = read(emp, "salaries_structures", "salary_structures", "salaries_history", "salaryHistory", "SalaryStructures");
    if (Array.isArray(fromArray)) return fromArray as SalaryPayload[];

    // The row may itself be the salary, flattened onto the employee.
    const flat = emp as Record<string, unknown> | null | undefined;
    if (
        flat?.base_salaries !== undefined ||
        flat?.base_salary !== undefined ||
        flat?.effective_date !== undefined ||
        flat?.deleted_at !== undefined ||
        flat?.salary_id !== undefined ||
        flat?.salaries_id !== undefined ||
        flat?.salaries_structure_id !== undefined
    ) {
        return [{
            id: flat?.salary_id ?? flat?.salaries_id ?? flat?.salaries_structure_id ?? 0,
            base_salaries: flat?.base_salaries,
            base_salary: flat?.base_salary,
            effective_date: flat?.effective_date,
            deleted_at: flat?.deleted_at,
            created_at: flat?.created_at,
            updated_at: flat?.updated_at,
            deletedAt: flat?.deletedAt,
            effectiveDate: flat?.effectiveDate,
            BaseSalaries: flat?.BaseSalaries,
            BaseSalary: flat?.BaseSalary,
        }];
    }

    return [];
};

export const getLatestSalaryStructure = (emp: SalaryPayload) => {
    const structures = getSalaryStructures(emp);
    if (!structures.length) return null;
    return [...structures].sort((a, b) => getSalaryRecordId(b, emp) - getSalaryRecordId(a, emp))[0];
};

export const isSoftDeleted = (deletedAt: unknown): boolean => {
    if (deletedAt && typeof deletedAt === "object") {
        const bag = deletedAt as Record<string, unknown>;
        if (Object.prototype.hasOwnProperty.call(bag, "Valid") && bag.Valid === false) {
            return false;
        }

        const nested =
            bag.Time ??
            bag.time ??
            bag.Bool ??
            bag.bool ??
            bag.Int64 ??
            bag.int64 ??
            bag.value;

        if (nested !== undefined) return isSoftDeleted(nested);
    }

    if (
        deletedAt === null ||
        deletedAt === undefined ||
        deletedAt === false ||
        deletedAt === 0 ||
        deletedAt === "0" ||
        deletedAt === "" ||
        deletedAt === "false" ||
        deletedAt === "null"
    ) {
        return false;
    }

    if (typeof deletedAt === "number") return deletedAt !== 0;

    if (typeof deletedAt === "string") {
        const normalized = deletedAt.trim().toLowerCase();
        if (["0", "false", "null", "", "0001-01-01t00:00:00z", "0001-01-01 00:00:00 +0000 utc"].includes(normalized)) return false;
        if (normalized.startsWith("0001-01-01")) return false;
        return true;
    }

    return Boolean(deletedAt);
};

// lockedReason turns the closed cycles paid from a record into the line the history table shows. The most
// recent cycle is named because it is the one that would have to be reopened first; the rest are counted,
// since a record that has been through five payrolls cannot list them all in the width available.
export const lockedReason = (cycles: string[] | undefined) => {
    const names = cycles ?? [];
    if (names.length === 0) return { label: "", title: "Already used in a payroll calculation" };

    const latest = names[names.length - 1];
    const others = names.length - 1;
    return {
        label: others > 0 ? `Paid in ${latest} +${others} more` : `Paid in ${latest}`,
        title: `Paid in ${names.length} closed payroll cycle${names.length > 1 ? "s" : ""}: ${names.join(", ")}`,
    };
};

// salaryActiveDefault decides how the "Active Salary Structure" box opens.
//
// GET /salaries answers an employee with nothing in force — no salary at all, or every record switched off —
// with a placeholder structure whose id is 0 and whose is_active is false. Reading that flag back would open
// the form unticked, and saving it posts a disable rather than a create: the server switches off nothing,
// answers 200, and the salary the user just typed is never written. A row with no record yet is a row whose
// first salary is being entered, and a first salary is switched on.
export const salaryActiveDefault = (salary: SalaryPayload, row?: SalaryPayload): boolean => {
    if (getSalaryRecordId(salary, row) === 0) return true;

    const flag = read(salary, "is_active", "isActive", "IsActive");
    if (typeof flag === "boolean") return flag;
    return !isSoftDeleted(getSalaryDeletedAt(salary, row));
};
