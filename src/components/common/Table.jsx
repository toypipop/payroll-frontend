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
    rowsPerPage = 10,
    enableSearch = true,
}) => {
    const [sortState, setSortState] = useState({ key: null, order: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const isCompact = density === "compact";

    const handleHeaderClick = (col) => {
        if (sortable === false || col.sortable === false) return;

        setCurrentPage(1);

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

    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return sortedData;
        
        const query = searchQuery.toLowerCase();
        return sortedData.filter(row => {
            return columns.some(col => {
                let value;
                if (col.render) {
                    // For columns with custom render, try to get raw value from data
                    value = row[col.key];
                } else {
                    value = row[col.key];
                }
                
                if (value == null) return false;
                return String(value).toLowerCase().includes(query);
            });
        });
    }, [sortedData, searchQuery, columns]);

    const styles = {
        tableContainer: {
            width: "100%",
        },
        tableScroll: {
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
        paginationWrap: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginTop: 0,
            padding: "8px 4px",
            backgroundColor: "#f0effe",
            borderRadius: "10px",
            fontSize: "13px",
            color: "#6259ca",
        },
        paginationInfo: {
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
        },
        pageMetaBadge: {
            display: "inline-flex",
            alignItems: "center",
            padding: "4px 10px",
            borderRadius: "999px",
            backgroundColor: "#f0effe",
            border: "1px solid #d7d2ff",
            color: "#6259ca",
            fontSize: "11px",
            fontWeight: "700",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
        },
        paginationButtons: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
        },
        pageButton: {
            minWidth: "36px",
            padding: "7px 11px",
            borderRadius: "10px",
            border: "1px solid #d7d2ff",
            backgroundColor: "#f0effe",
            color: "#6259ca",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            transition: "all 0.18s ease",
            boxShadow: "none",
        },
        pageButtonActive: {
            border: "1px solid #6259ca",
            backgroundColor: "#6259ca",
            color: "#ffffff",
            boxShadow: "none",
        },
        pageButtonDisabled: {
            opacity: 0.45,
            cursor: "not-allowed",
            boxShadow: "none",
        },
        searchBox: {
            margin: "6px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
        },
        searchInputWrapper: {
            flex: 1,
            position: "relative",
            display: "flex",
            alignItems: "center",
            width: "100%",
        },
        searchIcon: {
            position: "absolute",
            left: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#cbd5e1",
            pointerEvents: "none",
        },
        searchInput: {
            width: "100%",
            padding: "10px 12px 10px 38px",
            fontSize: "14px",
            fontWeight: "500",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            backgroundColor: "#ffffff",
            color: "var(--text-main)",
            outline: "none",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        },
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    const SearchIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
        </svg>
    );

    const safeData = filteredData || [];
    const safeRowsPerPage = Math.max(1, Number(rowsPerPage) || 10);
    const totalPages = Math.max(1, Math.ceil(safeData.length / safeRowsPerPage));
    const page = Math.min(currentPage, totalPages);
    const startIndex = (page - 1) * safeRowsPerPage;
    const paginatedData = safeData.slice(startIndex, startIndex + safeRowsPerPage);

    const pageButtons = useMemo(() => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, idx) => idx + 1);
        }

        if (page <= 3) {
            return [1, 2, 3, 4, totalPages];
        }

        if (page >= totalPages - 2) {
            return [1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        }

        return [1, page - 1, page, page + 1, totalPages];
    }, [page, totalPages]);

    return (
        <div style={styles.tableContainer}>
            {enableSearch && (
                <div style={styles.searchBox}>
                    <div style={styles.searchInputWrapper}>
                        <div style={styles.searchIcon}>
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            style={styles.searchInput}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#6259ca";
                                e.target.style.boxShadow = "0 0 0 3px rgba(98, 89, 202, 0.1)";
                                e.target.style.backgroundColor = "#ffffff";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e2e8f0";
                                e.target.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.03)";
                            }}
                        />
                    </div>
                </div>
            )}
            <div style={styles.tableScroll}>
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
                            paginatedData.map((row, rowIndex) => {
                                const absoluteRowIndex = startIndex + rowIndex;
                                const isLastRow = rowIndex === paginatedData.length - 1;
                                const isEven = rowIndex % 2 === 0;
                                const key = getRowKey
                                    ? getRowKey(row, absoluteRowIndex)
                                    : (row && (row.id ?? row.module_id)) ?? absoluteRowIndex;

                                const before = renderBeforeRow ? renderBeforeRow(row, absoluteRowIndex, paginatedData) : null;
                                const after = renderAfterRow ? renderAfterRow(row, absoluteRowIndex, paginatedData) : null;

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
                                                    typeof col.cellStyle === "function" ? col.cellStyle(row, absoluteRowIndex) : (col.cellStyle || null);

                                                return (
                                                    <td
                                                        key={colIndex}
                                                        style={{
                                                            ...styles.td,
                                                            ...(extraCellStyle || null),
                                                            borderBottom: isLastRow ? "none" : styles.td.borderBottom,
                                                        }}
                                                    >
                                                        {col.render ? col.render(row, absoluteRowIndex) : row[col.key]}
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
            {safeData.length > 0 && totalPages > 1 && (
                <div style={styles.paginationWrap}>
                    <div style={styles.paginationInfo}>
                        <span style={styles.pageMetaBadge}>Page {page} / {totalPages}</span>
                        <span>
                            Showing {startIndex + 1}-{Math.min(startIndex + safeRowsPerPage, safeData.length)} of {safeData.length}
                        </span>
                    </div>
                    <div style={styles.paginationButtons}>
                        <button
                            type="button"
                            style={{
                                ...styles.pageButton,
                                ...(page === 1 ? styles.pageButtonDisabled : null),
                            }}
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={page === 1}
                        >
                            <span aria-hidden="true">&larr;</span> Prev
                        </button>
                        {pageButtons.map((pageNum, index) => {
                            const showGap = index > 0 && pageNum - pageButtons[index - 1] > 1;

                            return (
                                <React.Fragment key={pageNum}>
                                    {showGap && <span style={{ padding: "0 2px", color: "#94a3b8" }}>...</span>}
                                    <button
                                        type="button"
                                        style={{
                                            ...styles.pageButton,
                                            ...(pageNum === page ? styles.pageButtonActive : null),
                                        }}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                        <button
                            type="button"
                            style={{
                                ...styles.pageButton,
                                ...(page === totalPages ? styles.pageButtonDisabled : null),
                            }}
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={page === totalPages}
                        >
                            Next <span aria-hidden="true">&rarr;</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;
