import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";

// useTimelogs owns the page's server data: the logs plus every master list the form and the bulk modal read.
export const useTimelogs = () => {
    const [timeLogs, setTimeLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [masterCompanies, setMasterCompanies] = useState([]);
    const [masterEmployees, setMasterEmployees] = useState([]);
    const [masterWorkLocations, setMasterWorkLocations] = useState([]);
    const [employeeData, setEmployeeData] = useState({});
    const [attendanceConfigs, setAttendanceConfigs] = useState({});
    const [dayOffWeekdaysByCompany, setDayOffWeekdaysByCompany] = useState({});
    const [canManageAttendanceSettings, setCanManageAttendanceSettings] = useState(false);

    const fetchTimeLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get("/timelogs");
            setTimeLogs(response.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchMasterData = async () => {
            try {
                // Fetch employees to show in dropdown
                const [empRes, locRes, schedRes, companyRes, modulesRes, dayOffRes] = await Promise.all([
                    api.get("/employees"),
                    api.get("/master/work-locations/options").catch(() => ({ data: [] })),
                    api.get("/timelogs/schedule-config").catch(() => ({ data: [] })),
                    api.get("/companies/options"),
                    api.get("/modules/mine").catch(() => ({ data: [] })),
                    api.get("/master/day-offs/options").catch(() => ({ data: [] })),
                ]);
                setMasterCompanies((companyRes.data || []).map((c) => ({ id: c.id, name: c.name })));
                setMasterEmployees(
                    empRes.data.map((e) => ({
                        id: e.id,
                        name: `${e.employees_code} - ${e.first_name} ${e.last_name}`,
                        companies_id: e.companies_id,
                    }))
                );
                
                const empDataMap = {};
                empRes.data.forEach((e) => {
                    empDataMap[e.id] = e;
                });
                setEmployeeData(empDataMap);
                
                setMasterWorkLocations((locRes.data || []).map((l) => ({ 
                    id: l.id, 
                    name: l.name,
                    companies_id: l.companies_id 
                })));

                const configMap = {};
                (schedRes.data || []).forEach((c) => {
                    if (c.companies_id) {
                        configMap[c.companies_id] = c;
                    }
                });
                setAttendanceConfigs(configMap);

                const dayOffMap = {};
                (dayOffRes.data || []).forEach((d) => {
                    if (!dayOffMap[d.companies_id]) dayOffMap[d.companies_id] = [];
                    dayOffMap[d.companies_id].push(d.weekday);
                });
                setDayOffWeekdaysByCompany(dayOffMap);

                const moduleKeys = [];
                const collectKeys = (items) => {
                    (items || []).forEach((m) => {
                        if (m.module_key) moduleKeys.push(m.module_key);
                        if (m.children) collectKeys(m.children);
                    });
                };
                collectKeys(modulesRes.data);
                setCanManageAttendanceSettings(moduleKeys.includes("AttendanceSettingsPage"));
            } catch (err) {
                console.error("Master Data Load Error", err);
            }
        };
        fetchMasterData();
        fetchTimeLogs();
    }, []);

    const remove = async (id) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            await api.delete(`/timelogs/${id}`);
            fetchTimeLogs();
        } catch (err) {
            alert(err.response?.data?.error || "Delete Failed");
        }
    };

    return {
        timeLogs, loading, fetchTimeLogs, remove,
        masterCompanies, masterEmployees, masterWorkLocations, employeeData,
        attendanceConfigs, dayOffWeekdaysByCompany, canManageAttendanceSettings,
    };
};

export default useTimelogs;
