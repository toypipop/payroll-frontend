import { BadgeCheck, Coffee, Footprints } from "lucide-react";
import { useState } from "react";
import type { CSSProperties } from "react";
import footImage from "../../assets/foot.jpg";
import lumiImage from "../../assets/lumi.jpg";

const heroTitle = "ไอ้อ้วนลูมี่";

const styles: Record<string, CSSProperties> = {
    page: {
        minHeight: "100vh",
        color: "#f8fafc",
        background: `
            radial-gradient(circle at 18% 8%, rgba(15, 118, 110, 0.5) 0%, transparent 35%),
            radial-gradient(circle at 84% 10%, rgba(245, 158, 11, 0.28) 0%, transparent 32%),
            linear-gradient(135deg, #081816 0%, #0f2421 48%, #111827 100%)
        `,
        padding: "14px",
        overflowX: "hidden",
    },
    shell: {
        width: "min(760px, 100%)",
        margin: "0 auto",
        display: "grid",
        gap: "14px",
    },
    hero: {
        minHeight: "calc(100vh - 28px)",
        display: "grid",
        alignContent: "center",
        justifyItems: "center",
        gap: "12px",
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(8, 24, 22, 0.78)",
        boxShadow: "0 32px 90px rgba(0, 0, 0, 0.46)",
        backdropFilter: "blur(26px)",
        overflow: "hidden",
        position: "relative",
        padding: "18px 14px",
    },
    keyword: {
        margin: 0,
        color: "#fde68a",
        fontFamily: "var(--font-display)",
        fontSize: "clamp(56px, 20vw, 122px)",
        fontWeight: 900,
        lineHeight: 0.78,
        letterSpacing: "0",
        textAlign: "center",
        textShadow: "0 20px 48px rgba(245, 158, 11, 0.34)",
        zIndex: 2,
    },
    keywordLine: {
        display: "block",
    },
    imageStage: {
        position: "relative",
        width: "min(430px, 94vw)",
        aspectRatio: "1 / 1",
        display: "grid",
        placeItems: "center",
        borderRadius: "8px",
        border: "1px solid rgba(245, 158, 11, 0.24)",
        background: `
            radial-gradient(circle at 50% 38%, rgba(245, 158, 11, 0.2), transparent 58%),
            rgba(15, 23, 42, 0.36)
        `,
        overflow: "hidden",
        zIndex: 2,
    },
    portrait: {
        width: "88%",
        height: "88%",
        objectFit: "contain",
        filter: "drop-shadow(0 24px 38px rgba(0,0,0,0.44))",
        transition: "transform 120ms ease, filter 120ms ease",
        userSelect: "none",
        pointerEvents: "none",
    },
    kickButton: {
        width: "min(430px, 94vw)",
        minHeight: "56px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        borderRadius: "8px",
        border: "0",
        background: "linear-gradient(135deg, var(--primary-color), #14b8a6)",
        color: "#fff",
        fontSize: "17px",
        fontWeight: 900,
        cursor: "pointer",
        boxShadow: "0 18px 34px rgba(15, 118, 110, 0.36)",
        zIndex: 2,
    },
    lowerGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
        gap: "14px",
        paddingBottom: "18px",
    },
    panel: {
        borderRadius: "8px",
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(8, 24, 22, 0.66)",
        backdropFilter: "blur(20px)",
        padding: "16px",
    },
    panelTitle: {
        margin: "0 0 8px",
        fontFamily: "var(--font-display)",
        fontSize: "16px",
        color: "#f8fafc",
    },
    panelCopy: {
        margin: 0,
        color: "rgba(248,250,252,0.66)",
        fontSize: "13px",
        lineHeight: 1.7,
    },
    statValue: {
        display: "block",
        color: "#ffffff",
        fontFamily: "var(--font-display)",
        fontSize: "28px",
        fontWeight: 900,
        lineHeight: 1,
    },
    statLabel: {
        display: "block",
        marginTop: "8px",
        color: "rgba(248,250,252,0.58)",
        fontSize: "12px",
    },
    checkItem: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        color: "rgba(248,250,252,0.78)",
        fontSize: "13px",
        lineHeight: 1.5,
    },
};

const LoginPage = () => {
    const [kickCount, setKickCount] = useState(0);
    const isKicked = kickCount % 2 === 1;
    const verdict =
        kickCount === 0
            ? "รอคำสั่งเตะจากฝ่ายแกล้งเพื่อน"
            : kickCount < 5
              ? "เริ่มมีเสียงป้าบดังขึ้นในระบบ"
              : kickCount < 12
                ? "ลูมี่เริ่มเสียหลักแบบมีเอกสารรับรอง"
                : "ฝ่ายบุคคลบันทึกว่าโดนเตะเชิงสัญลักษณ์หนักมาก";

    return (
        <main style={styles.page}>
            <style>
                {`
                    @keyframes kick-swing {
                        0% { opacity: 0; transform: translate(230px, 120px) rotate(-6deg) scale(0.72); }
                        18% { opacity: 1; transform: translate(104px, 58px) rotate(-20deg) scale(1.08); }
                        38% { opacity: 1; transform: translate(4px, 2px) rotate(-38deg) scale(1.25); }
                        54% { opacity: 1; transform: translate(-16px, -8px) rotate(-42deg) scale(1.3); }
                        100% { opacity: 0; transform: translate(144px, 78px) rotate(-14deg) scale(0.82); }
                    }

                    @keyframes impact-pop {
                        0% { opacity: 0; transform: translate(-50%, 12px) scale(0.72) rotate(-8deg); }
                        22% { opacity: 1; transform: translate(-50%, -20px) scale(1.3) rotate(5deg); }
                        100% { opacity: 0; transform: translate(-50%, -68px) scale(0.92) rotate(-3deg); }
                    }

                    @keyframes shock-flash {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5) rotate(0deg); }
                        28% { opacity: 1; transform: translate(-50%, -50%) scale(1.14) rotate(12deg); }
                        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.75) rotate(22deg); }
                    }

                    @keyframes prank-mark-fade {
                        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.56) rotate(-10deg); filter: blur(0px); }
                        12% { opacity: 0.92; transform: translate(-50%, -50%) scale(1.06) rotate(8deg); filter: blur(0px); }
                        62% { opacity: 0.7; transform: translate(-50%, -50%) scale(1) rotate(4deg); filter: blur(0.4px); }
                        100% { opacity: 0; transform: translate(-50%, -50%) scale(1.18) rotate(2deg); filter: blur(2px); }
                    }

                    .kick-foot {
                        position: absolute;
                        right: -74px;
                        bottom: 16px;
                        width: 270px;
                        height: 172px;
                        transform-origin: right center;
                        animation: kick-swing 640ms cubic-bezier(.12,.98,.18,1) both;
                        z-index: 5;
                        object-fit: contain;
                        pointer-events: none;
                        filter: drop-shadow(0 24px 28px rgba(0,0,0,0.46)) saturate(1.08) contrast(1.04);
                    }

                    .impact-burst {
                        position: absolute;
                        left: 44%;
                        top: 46%;
                        width: 154px;
                        height: 154px;
                        transform: translate(-50%, -50%);
                        border-radius: 50%;
                        pointer-events: none;
                        animation: shock-flash 620ms ease-out both;
                        z-index: 4;
                    }

                    .impact-burst::before,
                    .impact-burst::after {
                        content: "";
                        position: absolute;
                        inset: 0;
                        background:
                            conic-gradient(from 0deg, transparent 0 10deg, rgba(250, 204, 21, 0.95) 10deg 18deg, transparent 18deg 42deg, rgba(94, 234, 212, 0.8) 42deg 49deg, transparent 49deg 78deg, rgba(250, 204, 21, 0.95) 78deg 86deg, transparent 86deg 126deg, rgba(94, 234, 212, 0.72) 126deg 134deg, transparent 134deg 360deg);
                        clip-path: polygon(50% 50%, 100% 43%, 56% 56%, 72% 100%, 47% 61%, 0 70%, 42% 51%, 18% 0);
                    }

                    .impact-burst::after {
                        transform: rotate(38deg) scale(0.82);
                        opacity: 0.78;
                    }

                    .prank-mark {
                        position: absolute;
                        left: 43%;
                        top: 42%;
                        width: 92px;
                        height: 70px;
                        transform: translate(-50%, -50%);
                        border-radius: 58% 42% 48% 52%;
                        background:
                            radial-gradient(circle at 30% 35%, rgba(254, 202, 202, 0.78) 0 7px, transparent 8px),
                            radial-gradient(circle at 74% 30%, rgba(127, 29, 29, 0.86) 0 8px, transparent 9px),
                            radial-gradient(circle at 50% 58%, rgba(185, 28, 28, 0.84) 0 22px, transparent 23px),
                            radial-gradient(circle at 18% 70%, rgba(153, 27, 27, 0.75) 0 9px, transparent 10px);
                        box-shadow: 0 8px 18px rgba(127, 29, 29, 0.18);
                        opacity: 0;
                        animation: prank-mark-fade 2600ms ease-out both;
                        z-index: 2;
                        pointer-events: none;
                    }

                    .prank-mark::before,
                    .prank-mark::after {
                        content: "";
                        position: absolute;
                        border-radius: 50%;
                        background: rgba(185, 28, 28, 0.78);
                    }

                    .prank-mark::before {
                        width: 13px;
                        height: 13px;
                        right: -8px;
                        top: 20px;
                    }

                    .prank-mark::after {
                        width: 9px;
                        height: 9px;
                        left: 3px;
                        bottom: -7px;
                    }

                    @media (max-height: 720px) {
                        .login-prank-hero-title {
                            font-size: clamp(48px, 17vw, 92px) !important;
                        }
                    }
                `}
            </style>

            <section style={styles.shell}>
                <div style={styles.hero}>
                    <h1 className="login-prank-hero-title" style={styles.keyword}>
                        <span style={styles.keywordLine}>{heroTitle}</span>
                        <span style={styles.keywordLine}>https://discord.gg/khlinikf-kait-928311817271398501</span>
                    </h1>

                    <div style={styles.imageStage}>
                        <img
                            src={lumiImage}
                            alt="Lumi prank target"
                            style={{
                                ...styles.portrait,
                                transform: isKicked
                                    ? "rotate(-15deg) translateX(-24px) translateY(8px) scale(0.92)"
                                    : "rotate(4deg) translateX(3px) scale(1)",
                                filter: isKicked
                                    ? "drop-shadow(0 18px 28px rgba(0,0,0,0.46)) saturate(1.18) contrast(1.04)"
                                    : styles.portrait.filter,
                            }}
                        />
                        {kickCount > 0 && <span key={`burst-${kickCount}`} className="impact-burst" aria-hidden="true" />}
                        {kickCount > 0 && <span key={`mark-${kickCount}`} className="prank-mark" aria-hidden="true" />}
                        {kickCount > 0 && (
                            <img key={`foot-${kickCount}`} className="kick-foot" src={footImage} alt="" aria-hidden="true" />
                        )}
                        {kickCount > 0 && (
                            <span
                                key={`impact-${kickCount}`}
                                style={{
                                    position: "absolute",
                                    top: "16%",
                                    left: "54%",
                                    padding: "8px 14px",
                                    borderRadius: "6px",
                                    background: "rgba(245, 158, 11, 0.96)",
                                    color: "#1f2937",
                                    fontFamily: "var(--font-display)",
                                    fontSize: "24px",
                                    fontWeight: 900,
                                    animation: "impact-pop 620ms ease-out both",
                                    boxShadow: "0 18px 28px rgba(0,0,0,0.28)",
                                    zIndex: 6,
                                }}
                            >
                                ป้าบบบ!
                            </span>
                        )}
                    </div>

                    <button type="button" style={styles.kickButton} onClick={() => setKickCount((count) => count + 1)}>
                        <Footprints size={20} />
                        เตะลูมี่
                    </button>
                </div>

                <div style={styles.lowerGrid}>
                    <div style={styles.panel}>
                        <span style={styles.statValue}>{kickCount}</span>
                        <span style={styles.statLabel}>จำนวนป้าบที่บันทึกแล้ว</span>
                    </div>
                    <div style={styles.panel}>
                        <h2 style={styles.panelTitle}>รายงานสถานะ</h2>
                        <p style={styles.panelCopy}>
                            {verdict} ระบบยืนยันว่าเป็นการเตะเชิงสัญลักษณ์เพื่อความบันเทิงเท่านั้น
                        </p>
                    </div>
                    <div style={{ ...styles.panel, display: "grid", gap: "10px" }}>
                        <div style={styles.checkItem}>
                            <BadgeCheck size={18} color="#5eead4" />
                            โฟกัสหลัก: หน้า + ปุ่มเตะ
                        </div>
                        <div style={styles.checkItem}>
                            <Coffee size={18} color="#facc15" />
                            Final verdict: โดนเต็ม ๆ แบบไม่มีหักภาษี
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default LoginPage;
