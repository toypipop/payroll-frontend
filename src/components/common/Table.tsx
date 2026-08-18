import React, { useState, useMemo } from "react";
import { twMerge } from "tailwind-merge";
import type { ChangeEvent, Key, MouseEvent, ReactElement, ReactNode } from "react";
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
    const thClass = `border-b border-line-muted text-[11px] font-bold uppercase tracking-[0.07em] whitespace-nowrap text-control ${isCompact ? "px-2.5 py-2" : "px-5 py-[11px]"}`;
    const tdClass = `text-main ${isCompact ? "px-2.5 py-[7px] text-xs leading-[1.4]" : "px-5 py-[13px] text-sm leading-[1.55]"}`;
    const pageButtonClass = "min-w-[36px] cursor-pointer rounded-[10px] border border-primary-subtle bg-control-soft px-[11px] py-[7px] text-xs font-semibold text-control transition-all duration-[180ms]";
    const paginationChrome = "bg-control-soft text-control";

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
        <div className="w-full">
            {enableSearch && (
                <div className="m-1.5 flex items-center gap-2.5">
                    <div className="relative flex w-full flex-1 items-center">
                        <div className="pointer-events-none absolute left-3 flex items-center justify-center text-line-input">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full rounded-lg border border-line-muted bg-card py-2.5 pl-[38px] pr-3 text-sm font-medium text-main shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-all duration-200"
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
            <div className={`w-full ${fitWidth ? "overflow-x-visible" : "overflow-x-auto"}`}>
                <table className="w-full max-w-full border-separate border-spacing-0 text-left">
                    {!hideHeader && (
                        <thead className="bg-control-soft">
                            <tr>
                                {columns.map((col, index) => {
                                    const sortKey = getSortableKey(col);
                                    const isSorted = sortState.key === sortKey;
                                    const isSortable = sortable !== false && !!sortKey;
                                    const sortDir = isSorted ? sortState.order : null;

                                    return (
                                        <th
                                            key={index}
                                            className={twMerge(thClass, isSortable && "cursor-pointer select-none")}
                                            style={col.headerStyle || undefined}
                                            onClick={() => handleHeaderClick(col)}
                                        >
                                            <div className="flex items-center gap-1.5">
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
                                            className={`transition-colors duration-100 ${isEven ? "bg-card" : "bg-surface"} ${onRowClick ? "cursor-pointer" : "cursor-default"}`}
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
                                                        className={twMerge(tdClass, !isLastRow && "border-b border-line-muted")}
                                                        style={extraCellStyle || undefined}
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
                                    className={twMerge(tdClass, "border-b-0 p-[44px] text-center text-subtle")}
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {safeData.length > 0 && totalPages > 1 && (
                <div className={`flex flex-wrap items-center justify-between gap-3 rounded-[10px] px-1 py-2 text-[13px] ${paginationChrome}`}>
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="inline-flex items-center rounded-full border border-primary-subtle bg-control-soft px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.03em] text-control">Page {page} / {totalPages}</span>
                        <span>
                            Showing {startIndex + 1}-{Math.min(startIndex + safeRowsPerPage, safeData.length)} of {safeData.length}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <button
                            type="button"
                            className={twMerge(pageButtonClass, page === 1 && "cursor-not-allowed opacity-40")}
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
                                        className={twMerge(pageButtonClass, pageNum === page && "border-control bg-control text-white")}
                                        onClick={() => setCurrentPage(pageNum)}
                                    >
                                        {pageNum}
                                    </button>
                                </React.Fragment>
                            );
                        })}
                        <button
                            type="button"
                            className={twMerge(pageButtonClass, page === totalPages && "cursor-not-allowed opacity-40")}
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
