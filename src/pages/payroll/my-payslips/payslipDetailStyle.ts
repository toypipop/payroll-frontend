import { TONE_TEXT_STRONG } from "../../../components/common/tone";
import { payrollDetailTone } from "../payrollDetailTone";
import type { PayrollTransactionDetail } from "../../../types/api";

export const payslipDetailAmountClass = (detail: PayrollTransactionDetail): string =>
    `font-mono font-semibold ${TONE_TEXT_STRONG[payrollDetailTone(detail)]}`;
