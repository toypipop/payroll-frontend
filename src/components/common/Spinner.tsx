import { twMerge } from "tailwind-merge";

// A spinner takes the colour of the text around it, so it works on a filled button and on a plain surface alike.
const Spinner = ({ className = "" }: { className?: string }) => (
    <svg
        className={twMerge("h-3.5 w-3.5 shrink-0 animate-spin", className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-30" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export default Spinner;
