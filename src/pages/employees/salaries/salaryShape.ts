// The salary rows come back from several shapes of payload, so every read goes through one of these getters instead of guessing at the call site. Nothing here touches React.
export const getEmployeeId = (emp) =>
    emp?.ID ?? emp?.id ?? emp?.employees_id ?? emp?.employee_id ?? emp?.employees?.id ?? null;

export const getSalaryStructure = (emp) =>
    emp?.salaries_structure ?? emp?.salary_structure ?? emp?.salaries ?? null;

export const getSalaryRecordId = (salary, row) =>
    Number(
        salary?.id ??
            salary?.ID ??
            salary?.salary_id ??
            salary?.SalaryID ??
            salary?.salaries_id ??
            salary?.salaries_structure_id ??
            row?.salary_id ??
            row?.SalaryID ??
            row?.salaries_id ??
            row?.salaries_structure_id ??
            0,
    );

export const getSalaryBaseAmount = (salary, row) =>
    Number(
        salary?.base_salaries ??
            salary?.base_salary ??
            salary?.BaseSalaries ??
            salary?.BaseSalary ??
            row?.base_salaries ??
            row?.base_salary ??
            row?.BaseSalaries ??
            row?.BaseSalary ??
            0,
    );

export const getSalaryEffectiveDate = (salary, row) =>
    salary?.effective_date ??
    salary?.effectiveDate ??
    salary?.EffectiveDate ??
    row?.effective_date ??
    row?.effectiveDate ??
    row?.EffectiveDate ??
    "";

export const getSalaryDeletedAt = (salary, row) =>
    salary?.deleted_at ??
    salary?.deletedAt ??
    salary?.DeletedAt ??
    row?.deleted_at ??
    row?.deletedAt ??
    row?.DeletedAt;

export const getSalaryStructures = (emp) => {
    const direct = getSalaryStructure(emp);
    if (Array.isArray(direct)) return direct;
    if (direct && typeof direct === "object") return [direct];

    const fromArray =
        emp?.salaries_structures ??
        emp?.salary_structures ??
        emp?.salaries_history ??
        emp?.salaryHistory ??
        emp?.SalaryStructures;
    if (Array.isArray(fromArray)) return fromArray;

    if (
        emp?.base_salaries !== undefined ||
        emp?.base_salary !== undefined ||
        emp?.effective_date !== undefined ||
        emp?.deleted_at !== undefined ||
        emp?.salary_id !== undefined ||
        emp?.salaries_id !== undefined ||
        emp?.salaries_structure_id !== undefined
    ) {
        return [{
            id: emp?.salary_id ?? emp?.salaries_id ?? emp?.salaries_structure_id ?? 0,
            base_salaries: emp?.base_salaries,
            base_salary: emp?.base_salary,
            effective_date: emp?.effective_date,
            deleted_at: emp?.deleted_at,
            created_at: emp?.created_at,
            updated_at: emp?.updated_at,
            deletedAt: emp?.deletedAt,
            effectiveDate: emp?.effectiveDate,
            BaseSalaries: emp?.BaseSalaries,
            BaseSalary: emp?.BaseSalary,
        }];
    }

    return [];
};

export const getLatestSalaryStructure = (emp) => {
    const structures = getSalaryStructures(emp);
    if (!structures.length) return null;
    return [...structures].sort((a, b) => getSalaryRecordId(b, emp) - getSalaryRecordId(a, emp))[0];
};

export const isSoftDeleted = (deletedAt) => {
    if (deletedAt && typeof deletedAt === "object") {
        if (Object.prototype.hasOwnProperty.call(deletedAt, "Valid") && deletedAt.Valid === false) {
            return false;
        }

        const nested =
            deletedAt.Time ??
            deletedAt.time ??
            deletedAt.Bool ??
            deletedAt.bool ??
            deletedAt.Int64 ??
            deletedAt.int64 ??
            deletedAt.value;

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
