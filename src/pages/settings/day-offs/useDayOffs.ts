import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

export const weekdayOptions = [
    { id: "0", name: "Sunday" },
    { id: "1", name: "Monday" },
    { id: "2", name: "Tuesday" },
    { id: "3", name: "Wednesday" },
    { id: "4", name: "Thursday" },
    { id: "5", name: "Friday" },
    { id: "6", name: "Saturday" },
];

export const weekdayName = (value) => weekdayOptions.find((o) => String(o.id) === String(value))?.name || "-";

// useDayOffs owns the page's server data: the lists it renders, the loading flag, and the calls that change them.
export const useDayOffs = () => {
    const [items, setItems] = useState([]);
    const [companyOptions, setCompanyOptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [res, companiesRes] = await Promise.all([
                api.get("/master/day-offs"),
                api.get("/master/day-offs/companies").catch(() => ({ data: [] })),
            ]);
            setItems(res.data || []);
            setCompanyOptions((companiesRes.data || []).map((c) => ({ id: c.id, name: c.name })));
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const remove = async (id) => {
        if (!window.confirm("Delete this day off?")) return;
        try {
            await api.delete(`/master/day-offs/${id}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    return { items, companyOptions, loading, fetchData, remove };
};

export default useDayOffs;
