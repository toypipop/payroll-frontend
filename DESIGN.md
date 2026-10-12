# Payroll product context

This is an operational payroll application for company administrators and employees. The current validation work retains the existing compact forms, tables, sidebar and modal layout. The user-facing language is English with Thai data; business dates use Asia/Bangkok. The task does not establish a Japan-market requirement.

Runtime design tokens in [src/index.css](src/index.css) remain authoritative. The existing teal accent, light form surfaces, dark sidebar and semantic error tones provide the visual baseline. Reuse `Button`, `Modal`, `InputField`, `DecimalField`, `SelectField` and `DateField`; do not introduce a separate visual system for validation feedback.

Validation ownership and recovery behavior are recorded in [UX-CONTRACT.md](UX-CONTRACT.md). This document records the existing implementation and current task scope; it does not authorize a redesign.
