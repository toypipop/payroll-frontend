// The colours a figure can take are a closed set, so a caller names the tone and the class comes from here.
// This is what lets a value-driven colour be a class instead of an inline style.
export type Tone = "neutral" | "brand" | "success" | "danger" | "accent" | "muted";

export const TONE_TEXT: Record<Tone, string> = {
    neutral: "text-main",
    brand: "text-primary",
    success: "text-success",
    danger: "text-danger",
    accent: "text-accent",
    muted: "text-subtle",
};

// The strong text shade the printed forms use, where the soft one is too pale on paper.
export const TONE_TEXT_STRONG: Record<Tone, string> = {
    ...TONE_TEXT,
    success: "text-success-text",
    danger: "text-danger-text",
};

// The tint behind an icon, and the icon itself.
export const TONE_SOFT_BG: Record<Tone, string> = {
    neutral: "bg-hover",
    brand: "bg-primary-subtle",
    success: "bg-success-soft",
    danger: "bg-danger-soft",
    accent: "bg-warning-soft",
    muted: "bg-hover",
};

export const TONE_BG: Record<Tone, string> = {
    neutral: "bg-main",
    brand: "bg-primary",
    success: "bg-success",
    danger: "bg-danger",
    accent: "bg-accent",
    muted: "bg-subtle",
};

export const TONE_BORDER_HOVER: Record<Tone, string> = {
    neutral: "hover:border-main",
    brand: "hover:border-primary",
    success: "hover:border-success",
    danger: "hover:border-danger",
    accent: "hover:border-accent",
    muted: "hover:border-line",
};
