import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company } from "../../../types/domain";
import { apiErrorMessage } from "../../../utils/apiError";
import type { PayrollTransaction, PayslipResponse } from "../../../types/api";

// useTransactionSlip owns the company filter and the one payslip the details modal is showing.
export const useTransactionSlip = (homeCompanyId: string) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(homeCompanyId);
    const [selectedTransaction, setSelectedTransaction] = useState<PayrollTransaction | null>(null);
    const [slipData, setSlipData] = useState<PayslipResponse | null>(null);
    const [slipError, setSlipError] = useState<string | null>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const res = await api.get("/companies/options");
                setCompanies(res.data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchCompanies();
    }, []);

    const openDetails = async (tx: PayrollTransaction) => {
        setSelectedTransaction(tx);
        setSlipData(null);
        setSlipError(null);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/payroll/slip/${tx.id}`);
            setSlipData(res.data || null);
        } catch (err) {
            const msg = apiErrorMessage(err, "Unable to load transaction details.");
            setSlipError(msg);
        } finally {
            setLoadingDetails(false);
        }
    };

    const closeDetails = () => {
        setSelectedTransaction(null);
        setSlipData(null);
        setSlipError(null);
    };

    return {
        companies, selectedCompanyId, setSelectedCompanyId,
        selectedTransaction, slipData, slipError, loadingDetails, openDetails, closeDetails,
    };
};

export default useTransactionSlip;
