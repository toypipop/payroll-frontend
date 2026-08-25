import type { CSSProperties } from "react";
import CheckboxField from "../../../components/common/CheckboxField";
import SelectField from "../../../components/common/SelectField";
import Table from "../../../components/common/Table";
import type { TableColumn } from "../../../types/api";
import type { GroupedPermissionRow, PermissionGroup, PermissionRow } from "./usePermissionMatrix";

// Which actions and data scopes a module supports is declared by the backend

// Which boolean column each action writes to.
const ACTION_FIELD: Record<string, keyof PermissionRow> = {
    VIEW: "can_view",
    CREATE: "can_create",
    EDIT: "can_edit",
    DELETE: "can_delete",
};

const allowsAction = (item: PermissionRow, action: string) => (item?.allowed_actions || []).includes(action);

// A module with a single permitted scope has nothing to choose, so the selector is replaced by a plain label explaining why.
const hasScopeChoice = (item: PermissionRow) => (item?.allowed_scopes || []).length > 1;

const fixedScopeStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "13px",
    color: "var(--text-muted)",
};

const fixedScopeHintStyle: CSSProperties = {
    fontSize: "11px",
    color: "var(--text-subtle)",
};

const categoryRowStyle = {
    padding: "8px 20px",
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--control-accent)",
    backgroundColor: "var(--control-accent-soft)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    borderBottom: "1px solid var(--border-muted)",
    borderTop: "1px solid var(--border-muted)",
};

// Permission matrix with table structure
// A matrix row carries the group it was rendered under, so the category header can be drawn on its first row.
type MatrixRow = GroupedPermissionRow & { _categoryName: string; _categoryStart: boolean };

interface PermissionMatrixProps {
    permissions: PermissionRow[];
    groupedPermissions: PermissionGroup[];
    dataScopeOptions: { id: string; name: string }[];
    handleUpdateLocal: (index: number | undefined, field: keyof PermissionRow | Partial<PermissionRow>, value?: unknown) => void;
}

const PermissionMatrix = ({ permissions, groupedPermissions, dataScopeOptions, handleUpdateLocal }: PermissionMatrixProps) => {
    const flatItems: MatrixRow[] = groupedPermissions.flatMap((group) =>
        (group.items || []).map((item, idx) => ({
            ...item,
            _categoryName: group.categoryName,
            _categoryStart: Boolean(group.categoryName) && idx === 0,
        }))
    );

    const columns: TableColumn<MatrixRow>[] = [
        {
            label: "Module",
            render: (item) => item.module_name,
        },
        {
            label: "View",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                const row = permissions[item._flatIdx];
                if (item.actions_atomic) {
                    // One switch drives every action this module supports.
                    const fields = (item.allowed_actions || []).map((a) => ACTION_FIELD[a]).filter(Boolean);
                    const allGranted = fields.length > 0 && fields.every((f) => row?.[f]);
                    return (
                        <CheckboxField
                            checked={allGranted}
                            onChange={(e) =>
                                handleUpdateLocal(
                                    item._flatIdx,
                                    Object.fromEntries(fields.map((f) => [f, e.target.checked])),
                                )
                            }
                        />
                    );
                }
                if (!allowsAction(item, "VIEW")) return null;
                return (
                    <CheckboxField
                        checked={row?.can_view || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_view", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Create",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                if (item.actions_atomic || !allowsAction(item, "CREATE")) return null;
                return (
                    <CheckboxField
                        checked={permissions[item._flatIdx]?.can_create || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_create", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Edit",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                if (item.actions_atomic || !allowsAction(item, "EDIT")) return null;
                return (
                    <CheckboxField
                        checked={permissions[item._flatIdx]?.can_edit || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_edit", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Delete",
            headerStyle: { textAlign: "center", width: "7%" },
            cellStyle: { textAlign: "center" },
            render: (item) => {
                if (item.actions_atomic || !allowsAction(item, "DELETE")) return null;
                return (
                    <CheckboxField
                        checked={permissions[item._flatIdx]?.can_delete || false}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "can_delete", e.target.checked)}
                    />
                );
            },
        },
        {
            label: "Data Scope",
            headerStyle: { width: "32%" },
            render: (item) => {
                if (item.actions_atomic) return null;

                // Only one scope is enforceable, so there is nothing to pick.
                if (!hasScopeChoice(item)) {
                    return (
                        <span style={fixedScopeStyle}>
                            Full Companies
                            <span style={fixedScopeHintStyle}>this module has no per-person data</span>
                        </span>
                    );
                }

                return (
                    <SelectField
                        options={dataScopeOptions.filter((o) => item.allowed_scopes.includes(o.id))}
                        value={permissions[item._flatIdx]?.data_scope || item.allowed_scopes[0]}
                        onChange={(e) => handleUpdateLocal(item._flatIdx, "data_scope", e.target.value)}
                        containerClassName="mb-0"
                    />
                );
            },
        },
    ];

    return (
        <Table
            columns={columns}
            data={flatItems}
            getRowKey={(row) => String(row.module_id)}
            renderBeforeRow={(row) => {
                if (!row._categoryStart) return null;
                return (
                    <tr>
                        <td colSpan={columns.length} style={categoryRowStyle}>
                            {row._categoryName}
                        </td>
                    </tr>
                );
            }}
        />
    );
};

export default PermissionMatrix;
