import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// DetailDropdown shows a total that expands into the lines behind it. The panel renders through a portal so a table cell cannot clip it.
const DetailDropdown = ({ total, details, color, filterFn, itemColorFn }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ top: 0, left: 0 });
    const btnRef = useRef(null);
    const filtered = details.filter(filterFn || (() => true));
    const hasDetails = filtered.length > 0;

    const handleToggle = () => {
        if (!hasDetails) return;
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX });
        }
        setOpen(o => !o);
    };

    useEffect(() => {
        if (!open) return;
        const close = () => setOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [open]);

    return (
        <div style={{ fontFamily: "monospace", fontSize: "12px" }}>
            <button
                ref={btnRef}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                style={{
                    background: "none", border: "none", padding: 0, cursor: hasDetails ? "pointer" : "default",
                    display: "flex", alignItems: "center", gap: "4px", fontFamily: "monospace", fontSize: "12px",
                }}
            >
                <span style={{ fontWeight: "700", color }}>฿{formatCurrency(total)}</span>
                {hasDetails && <span style={{ fontSize: "10px", color: "#94a3b8" }}>{open ? "▲" : "▼"}</span>}
            </button>
            {open && hasDetails && ReactDOM.createPortal(
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: "absolute", zIndex: 9999, top: pos.top, left: pos.left,
                        background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.12)", padding: "8px 0", minWidth: "210px",
                    }}
                >
                    {filtered.map((d, i) => {
                        const itemColor = itemColorFn ? itemColorFn(d) : color;
                        return (
                            <div key={i} style={{
                                display: "flex", justifyContent: "space-between", alignItems: "center",
                                padding: "5px 14px", fontSize: "12px", gap: "16px",
                                borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none",
                            }}>
                                <span style={{ color: "#475569", whiteSpace: "nowrap" }}>{d.item_name}</span>
                                <span style={{ color: itemColor, fontWeight: "600", whiteSpace: "nowrap" }}>
                                    {d.type === "deduction" ? "-" : ""}฿{formatCurrency(d.amount)}
                                </span>
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};

export default DetailDropdown;
