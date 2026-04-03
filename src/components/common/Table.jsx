import React from "react";



const Table = ({
    columns,
    data = [],
    onRowClick,
    hideHeader = false,
    density = "normal", // "normal" | "compact"
    getRowKey,
    renderBeforeRow,
    renderAfterRow,
}) => {
    const isCompact = density === "compact";

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
        td: {
            padding: isCompact ? "7px 10px" : "13px 20px",
            fontSize: isCompact ? "12px" : "14px",
            color: "var(--text-main)",
            borderBottom: "1px solid #e2e8f0",
            lineHeight: isCompact ? "1.4" : "1.55",
        },
    };

    const safeData = data || [];

    return (
        <div style={styles.tableContainer}>
            <table style={styles.table}>
                {!hideHeader && (
                    <thead style={styles.thead}>
                        <tr>
                            {columns.map((col, index) => (
                                <th
                                    key={index}
                                    style={{
                                        ...styles.th,
                                        ...(col.headerStyle || null),
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}
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


// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ

// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ

// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ

// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ

// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ

// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ

// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ

// หกด้ืหกาีกฟ้ืกาส่หฟื้ก่าหืฟกาหฟ
