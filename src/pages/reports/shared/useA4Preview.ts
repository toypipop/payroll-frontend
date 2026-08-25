import { useEffect } from "react";

// useA4Preview handles what every print preview needs: lock the page behind it, and close on Escape.
export const useA4Preview = (isOpen: boolean, onClose: () => void) => {
    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);
};

// printElement prints one element by hiding everything else, which is how each report keeps its A4 layout intact.
export const printElement = (elementId: string) => {
    const style = document.createElement("style");
    style.innerHTML = `@media print { body * { visibility: hidden !important; } #${elementId}, #${elementId} * { visibility: visible !important; } #${elementId} { position: fixed !important; top: 0 !important; left: 0 !important; width: 210mm !important; box-shadow: none !important; margin: 0 !important; } @page { margin: 0; size: A4; } }`;
    document.head.appendChild(style);
    window.print();
    document.head.removeChild(style);
};

export default useA4Preview;
