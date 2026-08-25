import { useEffect, useState } from "react";
import api from "../../../api/axiosInstance";
import type { Company, DayOff, Employee, OptionRow, ScheduleConfig, TimeLog } from "../../../types/domain";
import type { AppModule } from "../../../types/api";
import { apiErrorMessage } from "../../../utils/apiError";
import type { ApiId } from "../../../types/api";

// useTimelogs owns the page's server data: the logs plus every master list the form and the bulk modal read.
export const useTimelogs = () => {
    const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
    const [loading, setLoading] = useState(true);
    // The three master lists are dropdown options this hook builds, not the API's full records.
    const [masterCompanies, setMasterCompanies] = useState<OptionRow[]>([]);
    const [masterEmployees, setMasterEmployees] = useState<OptionRow[]>([]);
    const [masterWorkLocations, setMasterWorkLocations] = useState<OptionRow[]>([]);
    // Keyed lookups the form reads while the user picks: employee by id, and per-company schedule and days off.
    const [employeeData, setEmployeeData] = useState<Record<string, Employee>>({});
    const [attendanceConfigs, setAttendanceConfigs] = useState<Record<string, ScheduleConfig>>({});
    const [dayOffWeekdaysByCompany, setDayOffWeekdaysByCompany] = useState<Record<string, number[]>>({});
    const [canManageAttendanceSettings, setCanManageAttendanceSettings] = useState(false);

    const fetchTimeLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get<TimeLog[]>("/timelogs");
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
                setMasterCompanies((companyRes.data || []).map((c: Company) => ({ id: c.id, name: c.name })));
                setMasterEmployees(
                    (empRes.data as Employee[]).map((e) => ({
                        id: e.id,
                        name: `${e.employees_code} - ${e.first_name} ${e.last_name}`,
                        companies_id: e.companies_id,
                    }))
                );
                
                const empDataMap: Record<string, Employee> = {};
                (empRes.data as Employee[]).forEach((e) => {
                    if (e.id != null) empDataMap[String(e.id)] = e;
                });
                setEmployeeData(empDataMap);
                
                setMasterWorkLocations((locRes.data || []).map((l: OptionRow) => ({ 
                    id: l.id, 
                    name: l.name,
                    companies_id: l.companies_id 
                })));

                const configMap: Record<string, ScheduleConfig> = {};
                (schedRes.data || []).forEach((c: ScheduleConfig) => {
                    if (c.companies_id) {
                        configMap[String(c.companies_id)] = c;
                    }
                });
                setAttendanceConfigs(configMap);

                const dayOffMap: Record<string, number[]> = {};
                (dayOffRes.data || []).forEach((d: DayOff) => {
                    const key = String(d.companies_id);
                    if (!dayOffMap[key]) dayOffMap[key] = [];
                    if (d.weekday != null) dayOffMap[key].push(d.weekday);
                });
                setDayOffWeekdaysByCompany(dayOffMap);

                const moduleKeys: string[] = [];
                const collectKeys = (items?: AppModule[]) => {
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

    const remove = async (id?: ApiId) => {
        if (!window.confirm("Are you sure you want to delete this log?")) return;
        try {
            await api.delete(`/timelogs/${id}`);
            fetchTimeLogs();
        } catch (err) {
            alert(apiErrorMessage(err, "Delete Failed"));
        }
    };

    return {
        timeLogs, loading, fetchTimeLogs, remove,
        masterCompanies, masterEmployees, masterWorkLocations, employeeData,
        attendanceConfigs, dayOffWeekdaysByCompany, canManageAttendanceSettings,
    };
};

export default useTimelogs;
