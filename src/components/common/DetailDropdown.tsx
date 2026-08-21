import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { TONE_TEXT } from "./tone";

const formatCurrency = (val) =>
    Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// DetailDropdown shows a total that expands into the lines behind it. The panel renders through a portal so a table cell cannot clip it.
const DetailDropdown = ({ total, details, tone = "neutral", filterFn, itemToneFn }) => {
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
        <div className="font-mono text-[12px]">
            <button
                ref={btnRef}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleToggle(); }}
                className={`flex items-center gap-1 border-none bg-none p-0 font-mono text-xs ${hasDetails ? "cursor-pointer" : "cursor-default"}`}
            >
                <span className={`font-bold ${TONE_TEXT[tone]}`}>฿{formatCurrency(total)}</span>
                {hasDetails && <span className="text-[10px] text-subtle">{open ? "▲" : "▼"}</span>}
            </button>
            {open && hasDetails && ReactDOM.createPortal(
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute z-[9999] min-w-[210px] rounded-lg border border-line-muted bg-white py-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
                    // measured from the trigger when the panel opens
                    style={{ top: pos.top, left: pos.left }}
                >
                    {filtered.map((d, i) => {
                        const itemTone = itemToneFn ? itemToneFn(d) : tone;
                        return (
                            <div
                                key={i}
                                className={`flex items-center justify-between gap-4 px-3.5 py-[5px] text-xs ${i < filtered.length - 1 ? "border-b border-hover" : ""}`}
                            >
                                <span className="text-body whitespace-nowrap">{d.item_name}</span>
                                <span className={`font-semibold whitespace-nowrap ${TONE_TEXT[itemTone]}`}>
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
