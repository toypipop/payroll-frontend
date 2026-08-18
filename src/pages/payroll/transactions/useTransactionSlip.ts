import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useTransactionSlip owns the company filter and the one payslip the details modal is showing.
export const useTransactionSlip = (homeCompanyId) => {
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(homeCompanyId);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [slipData, setSlipData] = useState(null);
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

    const openDetails = async (tx) => {
        setSelectedTransaction(tx);
        setSlipData(null);
        setSlipError(null);
        setLoadingDetails(true);
        try {
            const res = await api.get(`/payroll/slip/${tx.id}`);
            setSlipData(res.data || null);
        } catch (err) {
            const msg = err.response?.data?.error || "Unable to load transaction details.";
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
