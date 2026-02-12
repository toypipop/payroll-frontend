import React from "react";

const Table = ({ columns, data = [] }) => {
    const styles = {
        tableContainer: {
            width: "100%",
            overflowX: "auto",
            // Keep the container clean (English Comment)
        },
        table: {
            width: "100%",
            // Change collapse to separate to fix border bleed at corners (English Comment)
            borderCollapse: "separate",
            borderSpacing: 0,
            textAlign: "left",
        },
        thead: {
            backgroundColor: "#f8fafc",
        },
        th: {
            padding: "16px 24px",
            fontSize: "13px",
            fontWeight: "600",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "1px solid var(--border-color)",
        },
        td: {
            padding: "16px 24px",
            fontSize: "15px",
            color: "var(--text-main)",
            borderBottom: "1px solid var(--border-color)",
        },
        tr: {
            transition: "background-color 0.2s",
        },
        trHover: {
            backgroundColor: "#f1f5f9",
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
                            return (
                                <tr
                                    key={rowIndex}
                                    style={styles.tr}
                                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = styles.trHover.backgroundColor)}
                                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td 
                                            key={colIndex} 
                                            style={{
                                                ...styles.td,
                                                // Remove bottom border for the last row to prevent double borders or cut-offs at corners (English Comment)
                                                borderBottom: isLastRow ? "none" : styles.td.borderBottom
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
                                style={{ ...styles.td, textAlign: "center", padding: "40px", borderBottom: "none" }}
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