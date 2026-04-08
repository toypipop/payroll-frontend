import React, { useState, useMemo } from "react";


const SortIcon = ({ direction }) => {
    if (!direction) {
        return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M7 15l5 5 5-5" />
                <path d="M7 9l5-5 5 5" />
            </svg>
        );
    }
    if (direction === "asc") {
        return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 15l5 5 5-5" />
            </svg>
        );
    }
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 9l5-5 5 5" />
        </svg>
    );
};

const Table = ({
    columns,
    data = [],
    onRowClick,
    hideHeader = false,
    density = "normal",
    getRowKey,
    renderBeforeRow,
    renderAfterRow,
    sortable = true,
}) => {
    const [sortState, setSortState] = useState({ key: null, order: null });

    const isCompact = density === "compact";

    const handleHeaderClick = (col) => {
        if (sortable === false || col.sortable === false) return;

        setSortState((prev) => {
            if (prev.key !== col.sortKey && prev.key !== col.key) {
                return { key: col.sortKey || col.key, order: "asc" };
            }
            if (prev.order === "asc") {
                return { key: prev.key, order: "desc" };
            }
            if (prev.order === "desc") {
                return { key: null, order: null };
            }
            return { key: null, order: null };
        });
    };

    const sortedData = useMemo(() => {
        if (!sortState.key || !sortState.order) {
            return data;
        }

        return [...data].sort((a, b) => {
            const key = sortState.key;
            let aVal, bVal;

            if (key.includes(".")) {
                const keys = key.split(".");
                aVal = keys.reduce((obj, k) => obj?.[k], a);
                bVal = keys.reduce((obj, k) => obj?.[k], b);
            } else {
                const col = columns.find((c) => c.key === key || c.sortKey === key);
                if (col?.sortValue) {
                    aVal = col.sortValue(a);
                    bVal = col.sortValue(b);
                } else {
                    aVal = a[key];
                    bVal = b[key];
                }
            }

            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
            }

            const strA = String(aVal).toLowerCase();
            const strB = String(bVal).toLowerCase();

            if (strA < strB) return sortState.order === "asc" ? -1 : 1;
            if (strA > strB) return sortState.order === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortState, columns]);

    const styles = {
        tableContainer: {
            width: "100%",
            overflowX: "auto",
        },
        table: {
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            textAlign: "left",
        },
        thead: {
            backgroundColor: "#f0effe",
        },
        th: {
            padding: isCompact ? "8px 10px" : "11px 20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#6259ca",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            borderBottom: "1px solid #e2e8f0",
            whiteSpace: "nowrap",
        },
        thSortable: {
            cursor: "pointer",
            userSelect: "none",
        },
        thContent: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
        },
        td: {
            padding: isCompact ? "7px 10px" : "13px 20px",
            fontSize: isCompact ? "12px" : "14px",
            color: "var(--text-main)",
            borderBottom: "1px solid #e2e8f0",
            lineHeight: isCompact ? "1.4" : "1.55",
        },
    };

    const safeData = sortedData || [];

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                {!hideHeader && (
                    <thead style={styles.thead}>
                        <tr>
                            {columns.map((col, index) => {
                                const sortKey = col.sortKey || col.key;
                                const isSorted = sortState.key === sortKey;
                                const isSortable = col.sortable !== false && sortable !== false;
                                const sortDir = isSorted ? sortState.order : null;

                                return (
                                    <th
                                        key={index}
                                        style={{
                                            ...styles.th,
                                            ...(isSortable ? styles.thSortable : {}),
                                            ...(col.headerStyle || null),
                                        }}
                                        onClick={() => handleHeaderClick(col)}
                                    >
                                        <div style={styles.thContent}>
                                            {col.label}
                                            {isSortable && <SortIcon direction={sortDir} />}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                )}
                <tbody>
                    {safeData.length > 0 ? (
                        safeData.map((row, rowIndex) => {
                            const isLastRow = rowIndex === safeData.length - 1;
                            const isEven = rowIndex % 2 === 0;
                            const key = getRowKey
                                ? getRowKey(row, rowIndex)
                                : (row && (row.id ?? row.module_id)) ?? rowIndex;

                            const before = renderBeforeRow ? renderBeforeRow(row, rowIndex, safeData) : null;
                            const after = renderAfterRow ? renderAfterRow(row, rowIndex, safeData) : null;

                            return (
                                <React.Fragment key={key}>
                                    {before}
                                    <tr
                                        style={{
                                            backgroundColor: isEven ? "#ffffff" : "#f8fafc",
                                            cursor: onRowClick ? "pointer" : "default",
                                            transition: "background-color 0.1s",
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0effe")}
                                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isEven ? "#ffffff" : "#f8fafc")}
                                        onClick={() => onRowClick && onRowClick(row)}
                                    >
                                        {columns.map((col, colIndex) => {
                                            const extraCellStyle =
                                                typeof col.cellStyle === "function" ? col.cellStyle(row, rowIndex) : (col.cellStyle || null);

                                            return (
                                                <td
                                                    key={colIndex}
                                                    style={{
                                                        ...styles.td,
                                                        ...(extraCellStyle || null),
                                                        borderBottom: isLastRow ? "none" : styles.td.borderBottom,
                                                    }}
                                                >
                                                    {col.render ? col.render(row, rowIndex) : row[col.key]}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    {after}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                style={{
                                    ...styles.td,
                                    textAlign: "center",
                                    padding: "44px",
                                    color: "#94a3b8",
                                    borderBottom: "none",
                                }}
                            >
                                No data available
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
