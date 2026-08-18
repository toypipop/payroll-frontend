import React, { useState, useMemo } from "react";
import type { ChangeEvent, CSSProperties, Key, MouseEvent, ReactElement, ReactNode } from "react";
import type { SortState, TableColumn, TableRow } from "../../types/api";

interface TableProps<T extends TableRow = TableRow> {
    columns: TableColumn<T>[];
    data?: T[];
    onRowClick?: (row: T) => void;
    hideHeader?: boolean;
    density?: "normal" | "compact";
    getRowKey?: (row: T, rowIndex: number) => Key;
    renderBeforeRow?: (row: T, rowIndex: number, rows: T[]) => ReactNode;
    renderAfterRow?: (row: T, rowIndex: number, rows: T[]) => ReactNode;
    sortable?: boolean;
    rowsPerPage?: number;
    enableSearch?: boolean;
    // A printed sheet cannot be scrolled sideways, so a document table shares the width it has instead of overflowing.
    fitWidth?: boolean;
    defaultSort?: SortState | null;
    emptyMessage?: ReactNode;
}

const SortIcon = ({ direction }: { direction: SortState["order"] }) => {
    if (!direction) {
        return (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-30">
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

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
    </svg>
);

const ACTION_LABEL_PATTERN = /^(actions?|command|tools?)$/i;

const isActionColumn = (col: TableColumn) => {
    const label = String(col.label ?? "").trim();
    return label === "" || ACTION_LABEL_PATTERN.test(label);
};

const getNestedValue = (obj: unknown, path?: string) => {
    if (!path) return null;
    return path.split(".").reduce<unknown>((current, key) => {
        if (current && typeof current === "object" && key in current) {
            return (current as Record<string, unknown>)[key];
        }
        return undefined;
    }, obj);
};

const getRenderedText = (value: unknown): string => {
    if (value == null || typeof value === "boolean") return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(getRenderedText).join(" ");
    if (React.isValidElement(value)) return getRenderedText((value as ReactElement<{ children?: ReactNode }>).props.children);
    return "";
};

const getColumnValue = <T extends TableRow>(col: TableColumn<T>, row: T, rowIndex = 0) => {
    if (col.sortValue && typeof col.sortValue === "function") return col.sortValue(row);
    if (col.searchValue && typeof col.searchValue === "function") return col.searchValue(row);
    if (col.sortKey) return getNestedValue(row, col.sortKey);
    if (col.key) return getNestedValue(row, col.key);
    if (col.render && !isActionColumn(col)) return getRenderedText(col.render(row, rowIndex));
    return null;
};

const getSortableKey = (col: TableColumn): string | null => {
    if (col.sortable === false) return null;
    if (col.sortValue || col.searchValue || col.sortKey || col.key) return col.sortKey || col.key || String(col.label ?? "");
    if (col.render && !isActionColumn(col)) return String(col.label ?? "");
    return null;
};

const normalizeSearchValue = (value: unknown) => {
    const noComma = String(value ?? "").toLowerCase().replace(/,/g, "");
    if (/^-?\d+(\.\d+)?$/.test(noComma.trim())) {
        return String(parseFloat(noComma));
    }
    return noComma;
};

const normalizeSortValue = (value: unknown) => {
    if (value == null || value === "") return null;
    if (value instanceof Date) return value.getTime();
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? 1 : 0;

    const raw = String(value).trim();
    const numeric = raw.replace(/,/g, "").replace(/[^\d.-]/g, "");
    if (numeric && /^-?\d+(\.\d+)?$/.test(numeric)) {
        return Number(numeric);
    }

    const timestamp = Date.parse(raw);
    if (!Number.isNaN(timestamp) && /\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(raw)) {
        return timestamp;
    }

    return raw.toLowerCase();
};

const Table = <T extends TableRow = TableRow>({
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
    fitWidth = false,
    defaultSort = null,
    emptyMessage = "No data available",
}: TableProps<T>) => {
    const [sortState, setSortState] = useState<SortState>(defaultSort || { key: null, order: null });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");

    const isCompact = density === "compact";

    const handleHeaderClick = (col: TableColumn<T>) => {
        const nextKey = getSortableKey(col);
        if (sortable === false || !nextKey) return;

        setCurrentPage(1);

        setSortState((prev) => {
            if (prev.key !== nextKey) {
                return { key: nextKey, order: "asc" };
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
            const col = columns.find((c) => getSortableKey(c) === sortState.key);
            if (!col) return 0;

            const aVal = normalizeSortValue(getColumnValue(col, a));
            const bVal = normalizeSortValue(getColumnValue(col, b));

            if (aVal == null) return 1;
            if (bVal == null) return -1;

            if (typeof aVal === "number" && typeof bVal === "number") {
                return sortState.order === "asc" ? aVal - bVal : bVal - aVal;
            }

            const strA = String(aVal);
            const strB = String(bVal);

            if (strA < strB) return sortState.order === "asc" ? -1 : 1;
            if (strA > strB) return sortState.order === "asc" ? 1 : -1;
            return 0;
        });
    }, [data, sortState, columns]);

    const filteredData = useMemo(() => {
        if (!searchQuery.trim()) return sortedData;
        
        const normalizedQuery = normalizeSearchValue(searchQuery);

        return sortedData.filter(row => {
            return columns.some(col => {
                // Skip Actions and other non-searchable columns
                if (col.searchable === false || isActionColumn(col)) {
                    return false;
                }

                // If column has searchValue function, use it to get custom search text
                if (col.searchValue && typeof col.searchValue === 'function') {
                    const searchText = normalizeSearchValue(col.searchValue(row));
                    return searchText.includes(normalizedQuery);
                }

                // Use searchableKeys if provided, otherwise use key and sortKey
                let keysToSearch: string[] = [];

                if (col.searchableKeys && Array.isArray(col.searchableKeys)) {
                    keysToSearch = col.searchableKeys;
                } else {
                    if (col.key) keysToSearch.push(col.key);
                    if (col.sortKey) keysToSearch.push(col.sortKey);
                }

                // Check each key individually (handles "David" or "Wilson")
                const individualMatch = keysToSearch.some(key => {
                    const value = getNestedValue(row, key);
                    if (value == null) return false;
                    return normalizeSearchValue(value).includes(normalizedQuery);
                });
                if (individualMatch) return true;

                // Also check all keys joined (handles "David Wilson" spanning first+last name)
                if (keysToSearch.length > 1) {
                    const combined = keysToSearch
                        .map(key => getNestedValue(row, key) ?? "")
                        .join(" ")
                        .toLowerCase();
                    if (normalizeSearchValue(combined).includes(normalizedQuery)) return true;
                }

                if (col.render) {
                    const renderedText = getRenderedText(col.render(row, 0));
                    if (normalizeSearchValue(renderedText).includes(normalizedQuery)) return true;
                }

                return false;
            });
        });
    }, [sortedData, searchQuery, columns]);

    const styles: Record<string, CSSProperties> = {
        tableContainer: {
            width: "100%",
        },
        tableScroll: {
            width: "100%",
            overflowX: fitWidth ? "visible" : "auto",
        },
        table: {
            width: "100%",
            maxWidth: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            textAlign: "left",
        },
        thead: {
            backgroundColor: "var(--control-accent-soft)",
        },
        th: {
            padding: isCompact ? "8px 10px" : "11px 20px",
            fontSize: "11px",
            fontWeight: "700",
            color: "var(--control-accent)",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            borderBottom: "1px solid var(--border-muted)",
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
            borderBottom: "1px solid var(--border-muted)",
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
            backgroundColor: "var(--control-accent-soft)",
            borderRadius: "10px",
            fontSize: "13px",
            color: "var(--control-accent)",
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
            backgroundColor: "var(--control-accent-soft)",
            border: "1px solid #d7d2ff",
            color: "var(--control-accent)",
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
            backgroundColor: "var(--control-accent-soft)",
            color: "var(--control-accent)",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
            transition: "all 0.18s ease",
            boxShadow: "none",
        },
        pageButtonActive: {
            border: "1px solid var(--control-accent)",
            backgroundColor: "var(--control-accent)",
            color: "var(--bg-card)",
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
            color: "var(--border-input)",
            pointerEvents: "none",
        },
        searchInput: {
            width: "100%",
            padding: "10px 12px 10px 38px",
            fontSize: "14px",
            fontWeight: "500",
            border: "1px solid var(--border-muted)",
            borderRadius: "8px",
            backgroundColor: "var(--bg-card)",
            color: "var(--text-main)",
            outline: "none",
            transition: "all 0.2s ease",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
        },
    };

    const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

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
                                e.target.style.borderColor = "var(--control-accent)";
                                e.target.style.boxShadow = "0 0 0 3px rgba(98, 89, 202, 0.1)";
                                e.target.style.backgroundColor = "var(--bg-card)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "var(--border-muted)";
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
                                    const sortKey = getSortableKey(col);
                                    const isSorted = sortState.key === sortKey;
                                    const isSortable = sortable !== false && !!sortKey;
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
                                                backgroundColor: isEven ? "var(--bg-card)" : "var(--surface-subtle)",
                                                cursor: onRowClick ? "pointer" : "default",
                                                transition: "background-color 0.1s",
                                            }}
                                            onMouseEnter={(e: MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.backgroundColor = "var(--control-accent-soft)")}
                                            onMouseLeave={(e: MouseEvent<HTMLTableRowElement>) => (e.currentTarget.style.backgroundColor = isEven ? "var(--bg-card)" : "var(--surface-subtle)")}
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
                                                        {col.render ? col.render(row, absoluteRowIndex) : getRenderedText(getNestedValue(row, col.key))}
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
                                        color: "var(--text-subtle)",
                                        borderBottom: "none",
                                    }}
                                >
                                    {emptyMessage}
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
                                    {showGap && <span className="p-[0_2px] text-subtle">...</span>}
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
