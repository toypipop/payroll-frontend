import React from "react";

const Table = ({ columns, data = [], onRowClick }) => {
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
            backgroundColor: "#f8fafc",
        },
        th: {
            padding: "11px 20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            borderBottom: "1px solid #e2e8f0",
            whiteSpace: "nowrap",
        },
        td: {
            padding: "13px 20px",
            fontSize: "14px",
            color: "var(--text-main)",
            borderBottom: "1px solid #e2e8f0",
            lineHeight: "1.55",
        },
    };

    const safeData = data || [];

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                <thead style={styles.thead}>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} style={styles.th}>
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {safeData.length > 0 ? (
                        safeData.map((row, rowIndex) => {
                            const isLastRow = rowIndex === safeData.length - 1;
                            const isEven = rowIndex % 2 === 0;
                            return (
                                <tr
                                    key={rowIndex}
                                    style={{
                                        backgroundColor: isEven ? "#ffffff" : "#f8fafc",
                                        cursor: onRowClick ? "pointer" : "default",
                                        transition: "background-color 0.1s",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f0effe")}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = isEven ? "#ffffff" : "#f8fafc")}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td
                                            key={colIndex}
                                            style={{
                                                ...styles.td,
                                                borderBottom: isLastRow ? "none" : styles.td.borderBottom,
                                            }}
                                        >
                                            {col.render ? col.render(row, rowIndex) : row[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td
                                colSpan={columns.length}
                                style={{ ...styles.td, textAlign: "center", padding: "44px", color: "#94a3b8", borderBottom: "none" }}
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