import React, { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { NavLink } from "react-router-dom";
import api from "../../api/axiosInstance";
import type { AppModule } from "../../types/api";

const Sidebar = () => {
    type SidebarModule = AppModule & {
        parent_id?: string | number | null;
        order?: number;
        icon?: string;
    };

    const [menuItems, setMenuItems] = useState<SidebarModule[]>([]);
    const [loading, setLoading] = useState(true);

    const Icons = {
        Dashboard: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
        People: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
        Event: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
        EventNote: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M8 14h8"></path><path d="M8 18h5"></path></svg>,
        FactCheck: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="m9 10 2 2 4-4"></path><path d="M7 16h10"></path></svg>,
        Settings: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
        Badge: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.77-4.77 4 4 0 0 1 5.18 5.18 4 4 0 0 1-4.77 4.77 4 4 0 0 1-5.18-5.18z"></path><path d="m13.13 14.87-2 4.29a2 2 0 0 1-3.56 0l-2-4.29"></path><path d="M12 12 9 9"></path></svg>,
        Payments: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>,
        Schedule: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
        CorporateFare: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3"></path><path d="M19 21V11"></path><path d="M5 21V11"></path><path d="M9 21V11"></path><path d="M15 21V11"></path></svg>,
        WorkOutline: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
        LockPerson: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="3"></circle><path d="M12 2a5 5 0 0 0-5 5v3a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7a5 5 0 0 0-5-5z"></path><path d="M6 21v-1a4 4 0 0 1 8 0v1"></path></svg>,
        Business: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path></svg>,
        AccountBalanceWallet: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
                <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
                <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
            </svg>
        ),
        SettingsSuggest: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        ),
        AddCard: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
                <line x1="10" y1="14" x2="10" y2="14.01"></line>
                <line x1="14" y1="14" x2="18" y2="14"></line>
            </svg>
        ),
        PriceCheck: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 9V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V15"></path>
                <path d="m15 11 3 3 5-5"></path>
                <path d="M8 7h4"></path>
                <path d="M8 11h2"></path>
                <path d="M8 15h2"></path>
            </svg>
        ),
        ManageAccounts: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>,
        AdminPanelSettings: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path><circle cx="17" cy="17" r="3"></circle><path d="M17 14v1.5"></path><path d="M17 18.5V20"></path><path d="M14 17h1.5"></path><path d="M18.5 17H20"></path></svg>,
        Sync: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>,
        PlayCircle: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>,
        Description: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
        ReceiptLong: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h16v18l-3-2-3 2-2-2-2 2-3-2-3 2V3z"></path><line x1="8" y1="7" x2="16" y2="7"></line><line x1="8" y1="11" x2="16" y2="11"></line><line x1="8" y1="15" x2="13" y2="15"></line></svg>,
        Tune: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
        Summarize: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line><polyline points="6 13 8 15 10 13"></polyline></svg>,
        AccountBalance: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="22" x2="21" y2="22"></line>
                <line x1="6" y1="18" x2="6" y2="11"></line>
                <line x1="10" y1="18" x2="10" y2="11"></line>
                <line x1="14" y1="18" x2="14" y2="11"></line>
                <line x1="18" y1="18" x2="18" y2="11"></line>
                <polygon points="12 2 20 7 4 7"></polygon>
            </svg>
        ),
        Receipt: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"></path>
                <line x1="8" y1="8" x2="16" y2="8"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
                <line x1="8" y1="16" x2="12" y2="16"></line>
            </svg>
        ),
        HealthAndSafety: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <line x1="12" y1="8" x2="12" y2="14"></line>
                <line x1="9" y1="11" x2="15" y2="11"></line>
            </svg>
        ),
        Analytics: (color) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
                <line x1="2" y1="20" x2="22" y2="20"></line>
            </svg>
        ),
        CalendarMonth: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><rect x="8" y="14" width="3" height="3" rx="0.5"></rect></svg>,
        LocationOn: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path><circle cx="12" cy="9" r="2.5"></circle></svg>,
        EventAvailable: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"></path></svg>,
        WorkHistory: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"></path><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path><circle cx="18" cy="11" r="2"></circle><path d="M18 13v5"></path></svg>,
        Category: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="9" height="9" rx="1"></rect><rect x="13" y="2" width="9" height="9" rx="1"></rect><rect x="2" y="13" width="9" height="9" rx="1"></rect><path d="M17.5 13 22 17.5 17.5 22 13 17.5z"></path></svg>,
        TrendingUp: (color) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>,
        HelpOutline: (color: string) => (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
        ),
        Default: (color: string) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
    };

    useEffect(() => {
        const fetchModules = async () => {
            try {
                const response = await api.get<SidebarModule[]>("/modules/mine");
                const allModules = response.data;

                const tree = allModules
                    .filter(m => !m.parent_id)
                    .sort((a, b) => a.order - b.order)
                    .map(parent => ({
                        ...parent,
                        children: allModules
                            .filter(child => child.parent_id === parent.id)
                            .sort((a, b) => a.order - b.order)
                    }));

                setMenuItems(tree);
            } catch (error) {
                console.error("Failed to load sidebar", error);
            } finally {
                setLoading(false);
            }
        };
        fetchModules();
    }, []);

    const styles: Record<string, CSSProperties> = {
        sidebarContainer: { width: "260px", height: "100vh", position: "fixed", background: "linear-gradient(180deg, #0f172a 0%, var(--sidebar-bg) 100%)", borderRight: "1px solid var(--sidebar-border)", display: "flex", flexDirection: "column", padding: "24px 12px", zIndex: 1000, boxShadow: "inset -1px 0 0 rgba(255,255,255,0.04), 8px 0 30px rgba(2,6,23,0.22)" },
        logoSection: { display: "flex", alignItems: "center", padding: "0 12px", marginBottom: "32px", gap: "10px" },
        categoryLabel: { fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.11em", padding: "14px 12px 6px 12px" },
        navLink: { display: "flex", alignItems: "center", padding: "9px 12px", borderRadius: "10px", textDecoration: "none", fontSize: "13px", fontWeight: "500", marginBottom: "2px", transition: "all 0.15s ease" },
        subLink: { paddingLeft: "36px" }
    };

    const renderMenuItem = (item: SidebarModule, isSub = false): ReactNode => {
        const IconComponent = Icons[item.icon] || Icons.Default;

        if (item.is_category && !isSub) {
            if (!item.children || item.children.length === 0) return null;
            return (
                <div key={item.id} style={{ marginBottom: "16px" }}>
                    <div style={styles.categoryLabel}>{item.module_name}</div>
                    {item.children.map(child => renderMenuItem(child, true))}
                </div>
            );
        }

        return (
            <NavLink
                key={item.id}
                to={item.route_path}
                style={({ isActive }) => ({
                    ...styles.navLink,
                    paddingLeft: isSub ? "20px" : "12px",
                    backgroundColor: isActive ? "var(--sidebar-active)" : "transparent",
                    color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                })}
            >
                {({ isActive }) => (
                    <>
                        <div style={{ marginRight: "12px", display: "flex", alignItems: "center" }}>
                            {IconComponent(isActive ? "#2dd4bf" : "rgba(255,255,255,0.75)")}
                        </div>
                        <span style={{ fontWeight: isActive ? "600" : "400", whiteSpace: "nowrap" }}>
                            {item.module_name}
                        </span>
                    </>
                )}
            </NavLink>
        );
    };

    return (
        <div style={styles.sidebarContainer}>
            <div style={styles.logoSection}>
                <div style={{ width: "38px", height: "38px", background: "linear-gradient(160deg, #14b8a6, #0f766e)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", fontWeight: "800", fontSize: "18px", letterSpacing: "0.02em", boxShadow: "0 10px 20px rgba(15, 118, 110, 0.34)" }}>P</div>
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#f1f5f9", letterSpacing: "-0.01em", fontFamily: "var(--font-display)" }}>PayrollPro</span>
            </div>

            <nav style={{ flexGrow: 1, overflowY: "auto" }}>
                {loading ? <div>Loading...</div> : (() => {
                    const dashboard = menuItems.filter(m => m.module_key === 'DashboardPage');
                    const help = menuItems.filter(m => m.module_key === 'HelpPage');
                    const others = menuItems.filter(m => m.module_key !== 'DashboardPage' && m.module_key !== 'HelpPage');
                    return (
                        <>
                            {dashboard.map(item => renderMenuItem(item))}
                            {help.map(item => renderMenuItem(item))}
                            <NavLink
                                to="/my-payslips"
                                style={({ isActive }) => ({
                                    ...styles.navLink,
                                    backgroundColor: isActive ? "var(--sidebar-active)" : "transparent",
                                    color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
                                })}
                            >
                                {({ isActive }) => (
                                    <>
                                        <div style={{ marginRight: "12px", display: "flex", alignItems: "center" }}>
                                            {Icons.ReceiptLong(isActive ? "#2dd4bf" : "rgba(255,255,255,0.75)")}
                                        </div>
                                        <span style={{ fontWeight: isActive ? "600" : "400", whiteSpace: "nowrap" }}>
                                            My Payslips
                                        </span>
                                    </>
                                )}
                            </NavLink>
                            {others.map(item => renderMenuItem(item))}
                        </>
                    );
                })()}
            </nav>
        </div>
    );
};

export default Sidebar;
