"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronUp, Lock } from "lucide-react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import { evaluateRegistration, type EvaluationResult } from "@/lib/evaluation";
import {
    buildAttemptAnswers,
    saveSimulationAttempt,
    type PersistableEvaluationMapping,
} from "@/lib/simulation/attempts";
import type { SimulationEvaluationConfig } from "@/lib/simulation/runtime-evaluation";
import {
    EMPTY_NIL_RETURN_3B_DATA,
    NIL_RETURN_FINANCIAL_YEARS,
    NIL_RETURN_QUARTERS,
    NIL_RETURN_PERIODS_BY_QUARTER,
    type NilReturn3bData,
} from "@/lib/simulation/gst/nil-return-3b";

// ─── Constants ───────────────────────────────────────────────────────────────

const CACHE_PREFIX = "gst-nil-return-3b-mappings:";
const FIXED_CAPTCHA = "GST40";
const FIXED_OTP = "123456";

const GST_FOOTER_COLUMNS = [
    { title: "About GST", items: ["GST Council Structure", "GST History"] },
    { title: "Website Policies", items: ["Website Policy", "Terms and Conditions", "Hyperlink Policy", "Disclaimer"] },
    { title: "Related Sites", items: ["Central Board of Indirect Taxes and Customs", "State Tax Websites", "National Portal"] },
    { title: "Help and Taxpayer Facilities", items: ["System Requirements", "GST Knowledge Portal", "GST Media", "Site Map", "Grievance Nodal Officers", "Free Accounting and Billing Services", "GST Suvidha Providers"] },
] as const;

const GST_SERVICE_CARDS = [
    "Registration Services",
    "Return Dashboard",
    "Compliance Tools",
    "Filing Support",
] as const;

const GSTR1_RECORD_DETAIL_CARDS = [
    "4A, 4B, 6B, 6C - B2B, SEZ, DE Invoices",
    "5A - B2C (Large) Invoices",
    "6A - Exports Invoices",
    "7 - B2C (Others)",
    "8A, 8B, 8C, 8D - Nil Rated Supplies",
    "9B - Credit / Debit Notes (Registered)",
    "9B - Credit / Debit Notes (Unregistered)",
    "11A(1), 11A(2) - Tax Liability (Advance Received)",
    "11B(1), 11B(2) - Adjustment of Advances",
    "12 - HSN-wise summary of outward supplies",
    "13 - Documents Issued",
    "14 - Supplies made through ECO",
    "15 - Supplies U/s 9(5)",
] as const;

// ─── Per-question metadata ────────────────────────────────────────────────────

interface QuestionMeta {
    legalName: string;
    tradeName: string;
    gstin: string;
}

const META_BY_USERNAME: Record<string, QuestionMeta> = {
    "RAHUL@45":   { legalName: "RAHUL KISHAN", tradeName: "RK ASSOCIATES",  gstin: "20AFSXN5937H1Z2" },
    "PRIYA@21":   { legalName: "PRIYA SHARMA",  tradeName: "PS STORES",      gstin: "27BHXPS3814G1Z6" },
    "RAJAN@32":   { legalName: "RAJAN KUMAR",   tradeName: "RK TRADERS",     gstin: "07CKVKR5927H1Z3" },
    "KAVITHA@43": { legalName: "KAVITHA NAIR",  tradeName: "KN SERVICES",    gstin: "33DLXKN7048J1Z9" },
    "MOHAN@54":   { legalName: "MOHAN DAS",     tradeName: "MD ENTERPRISES", gstin: "29EMQMD2163K1Z2" },
};

const MONTH_NEXT: Record<string, string> = {
    "April": "May", "May": "June", "June": "July",
    "July": "August", "August": "September", "September": "October",
    "October": "November", "November": "December", "December": "January",
    "January": "February", "February": "March", "March": "April",
};

const MONTH_NUM: Record<string, string> = {
    "April": "04", "May": "05", "June": "06",
    "July": "07", "August": "08", "September": "09",
    "October": "10", "November": "11", "December": "12",
    "January": "01", "February": "02", "March": "03",
};

function getDueDates(period: string, financialYear: string) {
    const nextMonth = MONTH_NEXT[period] ?? "Next Month";
    const fyEnd = financialYear.split("-")[1] ?? "";
    const fyStart = financialYear.split("-")[0] ?? "";
    // For months Apr-Dec use start year, Jan-Mar use end year
    const yearPart = ["January","February","March"].includes(period) ? fyEnd : fyStart;
    const gstr1Due = `11/${MONTH_NUM[nextMonth] ?? ""}/${yearPart}`;
    const gstr3bDue = `20/${MONTH_NUM[nextMonth] ?? ""}/${yearPart}`;
    return { gstr1Due, gstr3bDue };
}

function getOtpExpiryLabel() {
    return new Date(Date.now() + 5 * 60000).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function getAcknowledgementReference() {
    return `AA${Math.floor(Math.random() * 9000000000000 + 1000000000000)}S`;
}

type Screen =
    | "landing"
    | "login"
    | "dashboard"
    | "ledger"
    | "file-returns"
    | "returns-list"
    | "gstr1-form"
    | "gstr1-filing"
    | "gstr3b-form"
    | "gstr3b-filing";

// ─── Cache helpers ────────────────────────────────────────────────────────────

function getCachedMappings(questionId: string | null) {
    if (typeof window === "undefined" || !questionId) return [];
    try {
        const raw = window.localStorage.getItem(`${CACHE_PREFIX}${questionId}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as PersistableEvaluationMapping[];
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}

function GSTLanding({ registerHref }: { registerHref: string }) {
    return (
        <>
            <section className="gst-sim-hero">
                <Image
                    src="/gst-simulation/gst-hero-reference.png"
                    alt="GST portal banner"
                    fill
                    priority
                    sizes="100vw"
                />
            </section>

            <main id="main-content" className="gst-sim-main">
                <section className="gst-sim-feature-row">
                    <div className="gst-sim-video-panel" aria-hidden="true" />

                    <div className="gst-sim-info-panel">
                        <div className="gst-sim-info-line long" />
                        <div className="gst-sim-info-line medium" />
                        <div className="gst-sim-info-split">
                            <div className="gst-sim-info-line short" />
                            <div className="gst-sim-info-line short" />
                        </div>
                    </div>
                </section>

                <section className="gst-sim-lower-grid">
                    <div className="gst-sim-cta-stack">
                        <Link className="gst-sim-register-link" href={registerHref}>
                            <Lock size={12} strokeWidth={2.25} />
                            <span>Register Now</span>
                        </Link>
                        <div className="gst-sim-secondary-panel" aria-hidden="true" />
                    </div>

                    <div className="gst-sim-service-grid">
                        {GST_SERVICE_CARDS.map((title) => (
                            <article key={title} className="gst-sim-service-card">
                                <div className="gst-sim-service-title">{title}</div>
                                <div className="gst-sim-service-list">
                                    <span />
                                    <span />
                                    <span />
                                    <span />
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}

// ─── Portal chrome (header + nav + footer) ────────────────────────────────────

function GSTPortalChrome({
    questionBadge,
    loggedIn,
    legalName,
    gstin,
    children,
    backHref,
    onLoginClick,
    registerHref,
}: {
    questionBadge: string;
    loggedIn: boolean;
    legalName?: string;
    gstin?: string;
    children: ReactNode;
    backHref: string;
    onLoginClick?: () => void;
    registerHref?: string;
}) {
    const resolvedRegisterHref = registerHref ?? "#";

    return (
        <div className="gst-sim-page gst-trn-page">
            {/* Top banner */}
            <div className="gst-sim-top-banner gst-trn-top-banner">
                <span>Simulated website - For Educational purpose only</span>
                <span className="gst-trn-question-badge">Question No: {questionBadge}</span>
            </div>

            {/* Access strip */}
            <div className="gst-sim-access-strip">
                <div className="gst-sim-access-inner">
                    <span>Skip to Main Content</span>
                    <span>⚙</span>
                    <span>A+</span>
                    <span>A-</span>
                </div>
            </div>

            {/* Header */}
            <header className="gst-sim-header">
                <div className="gst-sim-header-inner gst-trn-header-inner">
                    <div className="gst-trn-brand-strip">
                        <Image
                            className="gst-trn-brand-logo"
                            src="/prayog-logo.png"
                            alt="Prayog"
                            width={122}
                            height={34}
                            priority
                        />
                        <div className="gst-sim-brand">
                            <h1>Goods and Services Tax</h1>
                            <p>Government of India, States and Union Territories</p>
                        </div>
                    </div>

                    {loggedIn ? (
                        <div className="gst-nil-user-info">
                            <span className="gst-nil-user-name">👤 {legalName} ˅</span>
                            <span className="gst-nil-user-gstin">{gstin}</span>
                        </div>
                    ) : (
                        <div className="gst-sim-auth gst-trn-auth" aria-hidden="true">
                            <Link className="gst-sim-auth-link" href={resolvedRegisterHref}>REGISTER</Link>
                            <button
                                type="button"
                                onClick={onLoginClick}
                                style={{
                                    background: "#fff",
                                    color: "#1a2d72",
                                    fontWeight: 700,
                                    cursor: onLoginClick ? "pointer" : "default",
                                }}
                            >
                                LOGIN
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* Nav */}
            <nav className="gst-sim-nav">
                <div className="gst-sim-nav-inner gst-trn-nav-inner">
                    {["Home", "Services", "Dashboard", "GST Law", "Downloads", "Search Taxpayer", "Help and Taxpayer Facilities", "e-Invoice", "News and Updates"].map((item, i) => (
                        <span key={item} className={i === 0 ? "is-active" : undefined}>
                            {item}
                            {(item === "Services" || item === "Downloads") ? <small>▼</small> : null}
                        </span>
                    ))}
                </div>
            </nav>

            {children}

            {/* Footer */}
            <footer className="gst-sim-footer gst-trn-footer">
                <div className="gst-sim-footer-main">
                    {GST_FOOTER_COLUMNS.map((col) => (
                        <section key={col.title} className="gst-sim-footer-column">
                            <h2>{col.title}</h2>
                            <ul>
                                {col.items.map((item) => (
                                    <li key={item}><a href="#">{item}</a></li>
                                ))}
                            </ul>
                        </section>
                    ))}
                    <section className="gst-sim-footer-column gst-sim-footer-contact">
                        <h2>Contact Us</h2>
                        <div className="gst-sim-footer-contact-block">
                            <p>Help Desk Number:</p>
                            <a href="tel:18001034786">1800-103-4786</a>
                        </div>
                    </section>
                </div>
                <div className="gst-sim-footer-bottom">
                    <p>Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+, Firefox 45+ and Safari 6+</p>
                    <Link className="gst-sim-top-button" href={backHref}>
                        <ChevronUp size={24} strokeWidth={2.6} />
                        <span>Top</span>
                    </Link>
                </div>
            </footer>
        </div>
    );
}

// ─── Main simulator component ─────────────────────────────────────────────────

interface NilReturn3bClientProps {
    questionId: string | null;
    initialMode: string | null;
}

export function NilReturn3bClient({ questionId, initialMode }: NilReturn3bClientProps) {
    // ── Evaluation config ─────────────────────────────────────────────────────
    const [mappings, setMappings] = useState<PersistableEvaluationMapping[]>(
        () => getCachedMappings(questionId),
    );
    const [taskId, setTaskId] = useState<string | null>(null);
    const [showExpectedAnswers, setShowExpectedAnswers] = useState(false);
    const [questionBadge, setQuestionBadge] = useState("NIL_3B");

    // ── Simulation data ───────────────────────────────────────────────────────
    const [data, setData] = useState<NilReturn3bData>(EMPTY_NIL_RETURN_3B_DATA);
    const startScreen: Screen = initialMode === "login" ? "login" : "landing";
    const [screen, setScreen] = useState<Screen>(startScreen);

    // ── Login form state ──────────────────────────────────────────────────────
    const [captchaInput, setCaptchaInput] = useState("");
    const [loginError, setLoginError] = useState<string | null>(null);

    // ── File Returns state ────────────────────────────────────────────────────
    const [searched, setSearched] = useState(false);

    // ── GSTR-1 state ──────────────────────────────────────────────────────────
    const [nilGstr1Checked, setNilGstr1Checked] = useState(false);
    const [accordionOpen, setAccordionOpen] = useState(false);
    const [gstr1AddRecordOpen, setGstr1AddRecordOpen] = useState(true);
    const [gstr1AmendRecordOpen, setGstr1AmendRecordOpen] = useState(false);
    const [showSummaryBanner, setShowSummaryBanner] = useState(false);
    const [gstr1Signatory, setGstr1Signatory] = useState("");
    const [gstr1Filed, setGstr1Filed] = useState(false);
    const [showGstr1OtpModal, setShowGstr1OtpModal] = useState(false);
    const [showGstr1SuccessModal, setShowGstr1SuccessModal] = useState(false);
    const [gstr1OtpInput, setGstr1OtpInput] = useState("");
    const [gstr1OtpError, setGstr1OtpError] = useState("");
    const [gstr1SuccessBanner, setGstr1SuccessBanner] = useState(false);
    const [gstr1OtpValidUntil, setGstr1OtpValidUntil] = useState("");

    // ── GSTR-3B state ─────────────────────────────────────────────────────────
    const [nilReturn3bYes, setNilReturn3bYes] = useState(true);
    const [gstr3bSignatory, setGstr3bSignatory] = useState("");
    const [showGstr3bWarning, setShowGstr3bWarning] = useState(false);
    const [showGstr3bOtpModal, setShowGstr3bOtpModal] = useState(false);
    const [gstr3bOtpInput, setGstr3bOtpInput] = useState("");
    const [gstr3bOtpError, setGstr3bOtpError] = useState("");
    const [showFilingSuccess, setShowFilingSuccess] = useState(false);
    const [gstr3bOtpValidUntil, setGstr3bOtpValidUntil] = useState("");
    const [filingSuccessMeta, setFilingSuccessMeta] = useState<{
        date: string;
        time: string;
        arn: string;
    } | null>(null);

    // ── Evaluation ────────────────────────────────────────────────────────────
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null);
    const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);
    const [startTime] = useState<number>(() => Date.now());
    const hasSavedRef = useRef(false);

    const backHref = questionId ? `?questionId=${questionId}` : "#";
    const registerHref = questionId ? `/gst-simulation?questionId=${questionId}` : "/gst-simulation";

    // ── Load evaluation config ────────────────────────────────────────────────
    useEffect(() => {
        if (!questionId) return;

        async function loadConfig() {
            try {
                const res = await fetch(
                    `/api/simulation/questions/${questionId}/evaluation-config`,
                    { cache: "no-store" },
                );
                if (!res.ok) return;
                const config = (await res.json()) as SimulationEvaluationConfig;
                setTaskId(config.taskId);
                setShowExpectedAnswers(config.showExpectedAnswersInEvaluation);
                setMappings(config.mappings);
                if (config.questionTitle?.trim()) {
                    setQuestionBadge(config.questionTitle.trim());
                }
                try {
                    window.localStorage.setItem(
                        `${CACHE_PREFIX}${questionId}`,
                        JSON.stringify(config.mappings),
                    );
                } catch { /* ignore */ }
            } catch { /* ignore */ }
        }

        void loadConfig();
    }, [questionId]);

    // ── Save attempt ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!evaluationResults || hasSavedRef.current || !questionId) return;
        hasSavedRef.current = true;

        saveSimulationAttempt({
            questionId,
            taskId,
            startTime,
            endTime: startTime + evaluationResults.timeTakenSeconds * 1000,
            answers: buildAttemptAnswers(data, mappings),
        }).catch((err) => {
            hasSavedRef.current = false;
            console.error(err instanceof Error ? err.message : "Failed to save attempt.");
        });
    }, [data, evaluationResults, mappings, questionId, startTime, taskId]);

    // ── Derived values from mappings ──────────────────────────────────────────
    const expectedUsername = mappings.find(m => m.fieldPath === "username")?.expectedValue ?? "";
    const expectedPassword = mappings.find(m => m.fieldPath === "password")?.expectedValue ?? "";
    const meta = META_BY_USERNAME[expectedUsername] ?? { legalName: "USER", tradeName: "COMPANY", gstin: "GSTIN" };

    const periods = NIL_RETURN_PERIODS_BY_QUARTER[data.quarter] ?? [];
    const { gstr1Due, gstr3bDue } = data.financialYear && data.period
        ? getDueDates(data.period, data.financialYear)
        : { gstr1Due: "—", gstr3bDue: "—" };

    // ── Handlers ──────────────────────────────────────────────────────────────

    function updateData<K extends keyof NilReturn3bData>(key: K, value: NilReturn3bData[K]) {
        setData(prev => ({ ...prev, [key]: value }));
    }

    function handleLogin() {
        if (!data.username.trim()) { setLoginError("Username is required"); return; }
        if (!data.password.trim()) { setLoginError("Password is required"); return; }
        if (!captchaInput.trim()) { setLoginError("Please enter the CAPTCHA"); return; }
        if (captchaInput.trim().toUpperCase() !== FIXED_CAPTCHA.toUpperCase()) {
            setLoginError("Captcha does not match");
            return;
        }
        if (expectedUsername && data.username.trim() !== expectedUsername) {
            setLoginError("Invalid username or password");
            return;
        }
        if (expectedPassword && data.password.trim() !== expectedPassword) {
            setLoginError("Invalid username or password");
            return;
        }
        setLoginError(null);
        setScreen("dashboard");
    }

    function handleSearch() {
        if (!data.financialYear || !data.quarter || !data.period) return;
        setSearched(true);
    }

    function handleGstr1FileStatement() {
        if (!showSummaryBanner) {
            setShowSummaryBanner(true);
            return;
        }
        setScreen("gstr1-filing");
    }

    function handleFileGstr1WithEvc() {
        setShowGstr1OtpModal(true);
        setGstr1OtpInput("");
        setGstr1OtpError("");
        setGstr1OtpValidUntil(getOtpExpiryLabel());
    }

    function handleVerifyGstr1Otp() {
        if (gstr1OtpInput.trim() !== FIXED_OTP) {
            setGstr1OtpError("Please enter correct OTP which has been sent to your registered Email ID and Mobile number");
            return;
        }
        setShowGstr1OtpModal(false);
        setGstr1Filed(true);
        setGstr1SuccessBanner(true);
        setShowGstr1SuccessModal(true);
    }

    function handleGstr1SuccessClose() {
        setShowGstr1SuccessModal(false);
        setScreen("returns-list");
    }

    function handleFileGstr3bWithEvc() {
        if (!gstr1Filed) {
            setShowGstr3bWarning(true);
            return;
        }
        setShowGstr3bOtpModal(true);
        setGstr3bOtpInput("");
        setGstr3bOtpError("");
        setGstr3bOtpValidUntil(getOtpExpiryLabel());
    }

    function handleVerifyGstr3bOtp() {
        if (gstr3bOtpInput.trim() !== FIXED_OTP) {
            setGstr3bOtpError("Please enter correct OTP which has been sent to your registered Email ID and Mobile number");
            return;
        }
        setShowGstr3bOtpModal(false);
        setFilingSuccessMeta({
            date: new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }),
            time: new Date().toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            arn: getAcknowledgementReference(),
        });
        setShowFilingSuccess(true);
    }

    function handleWellDone() {
        setShowFilingSuccess(false);
        const endTime = Date.now();
        const results = evaluateRegistration(data, startTime, endTime, mappings);
        setEvaluationResults(results);
        setShowEvaluationPopup(true);
    }

    // ── Render evaluation popup ───────────────────────────────────────────────
    if (showEvaluationPopup && evaluationResults) {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner">
                    <EvaluationPopup
                        open={showEvaluationPopup}
                        results={evaluationResults}
                        showExpectedValues={showExpectedAnswers}
                        onClose={() => setShowEvaluationPopup(false)}
                    />
                </div>
            </GSTPortalChrome>
        );
    }

    // ── LANDING SCREEN ───────────────────────────────────────────────────────
    if (screen === "landing") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn={false}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
                registerHref={registerHref}
            >
                <GSTLanding registerHref={registerHref} />
            </GSTPortalChrome>
        );
    }

    // ── LOGIN SCREEN ──────────────────────────────────────────────────────────
    if (screen === "login") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn={false}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
                registerHref={registerHref}
            >
                <div className="gst-nil-inner">
                    <div className="gst-nil-breadcrumb">
                        <span>Home</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span>Login</span>
                        <span className="gst-nil-language">🌐 English</span>
                    </div>

                    <div className="gst-nil-login-wrap">
                        <div className="gst-nil-login-head">
                            <h2 className="gst-nil-login-title">Login</h2>
                            <div className="gst-nil-mandatory-hint">
                                <span>●</span> indicates mandatory fields
                            </div>
                        </div>

                        {loginError ? (
                            <p className="gst-nil-field-error" style={{ marginBottom: 10 }}>
                                {loginError}
                            </p>
                        ) : null}

                        <div className="gst-nil-field-row">
                            <label className="gst-nil-label">
                                Username <span>*</span>
                            </label>
                            <input
                                className="gst-nil-input"
                                type="text"
                                placeholder="Enter Username"
                                value={data.username}
                                onChange={e => updateData("username", e.target.value)}
                                autoComplete="username"
                            />
                        </div>

                        <div className="gst-nil-field-row">
                            <label className="gst-nil-label">
                                Password <span>*</span>
                            </label>
                            <input
                                className="gst-nil-input"
                                type="password"
                                placeholder="Enter Password"
                                value={data.password}
                                onChange={e => updateData("password", e.target.value)}
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="gst-nil-field-row">
                            <label className="gst-nil-label">
                                Type the characters you see in the image below <span>*</span>
                            </label>
                            <div className="gst-nil-captcha-row">
                                <input
                                    className="gst-nil-input gst-nil-captcha-input"
                                    type="text"
                                    placeholder="Enter characters as displayed in the CAPTCHA image"
                                    value={captchaInput}
                                    onChange={e => setCaptchaInput(e.target.value)}
                                    maxLength={8}
                                />
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <div className="gst-nil-captcha-img">{FIXED_CAPTCHA}</div>
                            </div>
                        </div>

                        <button className="gst-nil-login-btn" type="button" onClick={handleLogin}>
                            LOGIN
                        </button>

                        <div className="gst-nil-login-links">
                            <a href="#">Forgot Username</a>
                            <a href="#">Forgot Password</a>
                        </div>

                        <p className="gst-nil-login-info">
                            <strong>ℹ First time login:</strong> If you are logging in for the first time, click{" "}
                            <a href="#">here</a> to log in.
                        </p>
                    </div>
                </div>
            </GSTPortalChrome>
        );
    }

    // ── DASHBOARD SCREEN ──────────────────────────────────────────────────────
    if (screen === "dashboard") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner">
                    <div className="gst-nil-breadcrumb">
                        <span style={{ color: "#2d5da8" }}>Dashboard</span>
                        <span className="gst-nil-language">🌐 English</span>
                    </div>

                    <div className="gst-nil-dash-wrap">
                        <div className="gst-nil-dash-main">
                            <p className="gst-nil-dash-title">Welcome {meta.tradeName} to GST Common Portal</p>

                            <div className="gst-nil-dash-info-box">
                                You can navigate to your chosen page through navigation panel given below
                            </div>

                            <div className="gst-nil-dash-btn-grid">
                                <button className="gst-nil-dash-btn" type="button" onClick={() => { setScreen("file-returns"); setSearched(false); }}>
                                    RETURN DASHBOARD &gt;
                                </button>
                                <button className="gst-nil-dash-btn" type="button">
                                    CREATE CHALLAN &gt;
                                </button>
                                <button className="gst-nil-dash-btn" type="button">
                                    VIEW NOTICE(S) AND ORDER(S) &gt;
                                </button>
                            </div>
                            <div className="gst-nil-dash-annual-row">
                                <button className="gst-nil-dash-btn gst-nil-dash-annual-btn" type="button">
                                    ANNUAL RETURN &gt;
                                </button>
                            </div>

                            <div className="gst-nil-dash-continue">
                                <span>Else Go to &nbsp;»</span>
                                <button className="gst-nil-dash-continue-btn" type="button" onClick={() => setScreen("ledger")}>
                                    CONTINUE TO DASHBOARD &gt;
                                </button>
                            </div>
                        </div>

                        <div className="gst-nil-dash-sidebar">
                            <button className="gst-nil-view-profile" type="button">
                                View Profile &nbsp; ❯
                            </button>
                            <p className="gst-nil-quick-links-title">Quick Links</p>
                            <a className="gst-nil-quick-link" href="#">Check Cash Balance</a>
                            <a className="gst-nil-quick-link" href="#">Liability ledger</a>
                            <a className="gst-nil-quick-link" href="#">Credit ledger</a>
                        </div>
                    </div>
                </div>
            </GSTPortalChrome>
        );
    }

    // ── LEDGER SCREEN ─────────────────────────────────────────────────────────
    if (screen === "ledger") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner gst-nil-ledger-page">
                    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
                        <div className="gst-nil-ledger-breadcrumb">
                            <button
                                type="button"
                                className="gst-nil-breadcrumb-link"
                                onClick={() => setScreen("dashboard")}
                            >
                                Dashboard
                            </button>
                            <span className="gst-nil-breadcrumb-sep">›</span>
                            <span>Ledger</span>
                            <span className="gst-nil-language">🌐 English</span>
                        </div>

                        <div className="gst-nil-ledger-card">
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 13, fontWeight: 600 }}>Ledger Balance</span>
                                <span style={{ fontSize: 9, color: "#888", borderLeft: "1px solid #ccc", paddingLeft: 10 }}>
                                    {new Date().toLocaleDateString("en-GB").replace(/\//g, "/")} Download ❯
                                </span>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr 1fr 1fr", fontSize: 9, border: "1px solid #ccc" }}>
                                {["", "IGST (₹)", "CGST (₹)", "SGST (₹)", "CESS (₹)"].map(h => (
                                    <div key={h} style={{ padding: "7px 14px", background: "#eee", fontWeight: 600, borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc" }}>{h}</div>
                                ))}
                                {["Electronic Liability Register (Return related)", "Electronic Cash Ledger", "Electronic Credit Ledger"].map(row => (
                                    <Fragment key={row}>
                                        <div style={{ padding: "7px 14px", fontWeight: 500, borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc", fontSize: 9 }}>{row}</div>
                                        {[0, 0, 0, 0].map((_, i) => (
                                            <div key={i} style={{ padding: "7px 14px", textAlign: "right", borderRight: "1px solid #ccc", borderBottom: "1px solid #ccc", fontSize: 9 }}>0</div>
                                        ))}
                                    </Fragment>
                                ))}
                            </div>
                            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                                <button
                                    className="gst-nil-btn"
                                    type="button"
                                    onClick={() => { setScreen("file-returns"); setSearched(false); }}
                                    style={{ height: 28 }}
                                >
                                    FILE RETURNS &gt;
                                </button>
                                <button className="gst-nil-btn" type="button" style={{ height: 28 }}>PAY TAX &gt;</button>
                            </div>
                        </div>

                        <div className="gst-nil-ledger-card gst-nil-ledger-card-secondary">
                            <p style={{ fontSize: 9, fontWeight: 600, color: "#333", margin: "0 0 8px" }}>
                                Annual Aggregate Turnover <span style={{ color: "#2d5da8", fontWeight: 400 }}>(includes all GSTINs of the related PAN)</span>
                            </p>
                            <table style={{ fontSize: 9, borderCollapse: "collapse", minWidth: 360 }}>
                                <thead>
                                    <tr>
                                        {["Financial Year", "Annual Aggregate Turnover"].map(h => (
                                            <th key={h} style={{ background: "#1a2d72", color: "#fff", padding: "7px 18px", textAlign: "center", border: "1px solid #aaa" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: "6px 18px", textAlign: "center", border: "1px solid #ccc", background: "#f5f5f5" }}>
                                            {data.financialYear || "2019-20"}
                                        </td>
                                        <td style={{ padding: "6px 18px", textAlign: "center", border: "1px solid #ccc", background: "#f5f5f5" }}>Upto Rs.5 Cr*.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </GSTPortalChrome>
        );
    }

    // ── FILE RETURNS SCREEN ───────────────────────────────────────────────────
    if (screen === "file-returns") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner">
                    <div className="gst-nil-breadcrumb">
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("dashboard")}>Dashboard</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span>Returns</span>
                        <span className="gst-nil-language">🌐 English</span>
                    </div>

                    <div className="gst-nil-returns-wrap">
                        <div className="gst-nil-returns-card">
                            <h3 className="gst-nil-returns-title">File Returns</h3>
                            <div className="gst-nil-info-strip">
                                GSTR-2A can now be downloaded in excel/CSV format for your reference and further use. Nil return for GSTR-1, GSTR-3B and CMP-08 can now be filed through SMS.
                            </div>
                            <div className="gst-nil-mandatory-row"><span>●</span> indicates mandatory fields</div>

                            <div className="gst-nil-filter-row">
                                <div className="gst-nil-filter-field">
                                    <label className="gst-nil-filter-label">Financial Year <span>*</span></label>
                                    <select
                                        className="gst-nil-select"
                                        value={data.financialYear}
                                        onChange={e => { updateData("financialYear", e.target.value); updateData("quarter", ""); updateData("period", ""); setSearched(false); }}
                                    >
                                        <option value="">Select</option>
                                        {NIL_RETURN_FINANCIAL_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="gst-nil-filter-field">
                                    <label className="gst-nil-filter-label">Quarter <span>*</span></label>
                                    <select
                                        className="gst-nil-select"
                                        value={data.quarter}
                                        onChange={e => { updateData("quarter", e.target.value); updateData("period", ""); setSearched(false); }}
                                    >
                                        <option value="">Select</option>
                                        {NIL_RETURN_QUARTERS.map(q => <option key={q} value={q}>{q}</option>)}
                                    </select>
                                </div>
                                <div className="gst-nil-filter-field">
                                    <label className="gst-nil-filter-label">Period <span>*</span></label>
                                    <select
                                        className="gst-nil-select"
                                        value={data.period}
                                        onChange={e => { updateData("period", e.target.value); setSearched(false); }}
                                    >
                                        <option value="">Select</option>
                                        {periods.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <button className="gst-nil-search-btn" type="button" onClick={handleSearch}>
                                    SEARCH
                                </button>
                            </div>

                            {searched && (
                                <div className="gst-nil-freq-strip">
                                    You have selected to file the return on monthly frequency, GSTR-1 and GSTR-3B shall be required to be filled for each month of the quarter.
                                </div>
                            )}
                        </div>

                        {/* ── Return cards ───────────────────────────────── */}
                        {searched && (
                            <div className="gst-nil-cards-section">
                                <div className="gst-nil-cards-top">
                                    {/* GSTR-1 card */}
                                    <div className="gst-nil-return-card">
                                        <div className="gst-nil-card-header">
                                            Details of outward supplies of goods or services<br />
                                            <span style={{ fontSize: 8 }}>GSTR1</span>
                                        </div>
                                        <div className="gst-nil-card-body">
                                            {gstr1Filed ? (
                                                <p className="gst-nil-card-due is-filed">Status - &nbsp;Filed</p>
                                            ) : (
                                                <p className="gst-nil-card-due">Due Date - &nbsp;{gstr1Due}</p>
                                            )}
                                            <div className="gst-nil-card-btns">
                                                {gstr1Filed ? (
                                                    <>
                                                        <button className="gst-nil-card-btn" type="button">VIEW</button>
                                                        <button className="gst-nil-card-btn" type="button">DOWNLOAD</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button className="gst-nil-card-btn" type="button" onClick={() => { setShowSummaryBanner(false); setScreen("gstr1-form"); }}>PREPARE ONLINE</button>
                                                        <button className="gst-nil-card-btn outline" type="button">PREPARE OFFLINE</button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* GSTR2A card */}
                                    <div className="gst-nil-return-card">
                                        <div className="gst-nil-card-header">
                                            Auto Drafted details (For view only)<br />
                                            <span style={{ fontSize: 8 }}>GSTR2A</span>
                                        </div>
                                        <div className="gst-nil-card-body">
                                            <div className="gst-nil-card-btns">
                                                <button className="gst-nil-card-btn" type="button">VIEW</button>
                                                <button className="gst-nil-card-btn outline" type="button">DOWNLOAD</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GSTR2B card */}
                                    <div className="gst-nil-return-card">
                                        <div className="gst-nil-card-header">
                                            Auto - drafted ITC Statement<br />
                                            <span style={{ fontSize: 8 }}>GSTR2B</span>
                                        </div>
                                        <div className="gst-nil-card-body">
                                            <div className="gst-nil-card-btns">
                                                <button className="gst-nil-card-btn" type="button">VIEW</button>
                                                <button className="gst-nil-card-btn outline" type="button">DOWNLOAD</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="gst-nil-cards-bottom">
                                    {/* GSTR3B card */}
                                    <div className="gst-nil-return-card">
                                        <div className="gst-nil-card-header">
                                            Monthly Return<br />
                                            <span style={{ fontSize: 8 }}>GSTR3B</span>
                                        </div>
                                        <div className="gst-nil-card-body">
                                            <p className="gst-nil-card-due">Due Date - &nbsp;{gstr3bDue}</p>
                                            <div className="gst-nil-card-btns">
                                                <button className="gst-nil-card-btn" type="button" onClick={() => setScreen("gstr3b-form")}>PREPARE ONLINE</button>
                                                <button className="gst-nil-card-btn outline" type="button">PREPARE OFFLINE</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </GSTPortalChrome>
        );
    }

    // ── GSTR-1 FORM SCREEN ────────────────────────────────────────────────────
    if (screen === "gstr1-form") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner">
                    <div className="gst-nil-breadcrumb">
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("dashboard")}>Dashboard</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("returns-list")}>Returns</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span>GSTR-1/IFF</span>
                        <span className="gst-nil-language">🌐 English</span>
                    </div>

                    <div className="gst-nil-form-wrap">
                        {/* Teal banner */}
                        <div className="gst-nil-teal-banner">
                            <span>GSTR-1 - Details of outward supplies of goods or services</span>
                            <div className="gst-nil-banner-actions">
                                <button className="gst-nil-banner-btn" type="button">E-INVOICE ADVISORY</button>
                                <button className="gst-nil-banner-btn" type="button">HELP ℹ</button>
                                <button className="gst-nil-banner-btn" type="button">↻</button>
                            </div>
                        </div>

                        {/* Info row */}
                        <div className="gst-nil-info-row">
                            <span style={{ color: "#333" }}>GSTIN -<span>{meta.gstin}</span></span>
                            <span style={{ color: "#333" }}>FY - <span>{data.financialYear}</span></span>
                            <span style={{ color: "#333" }}>Legal Name - <span>{meta.legalName}</span></span>
                            <span style={{ color: "#333" }}>Trade Name - <span>{meta.tradeName}</span></span>
                            <span style={{ color: "#333" }}>Return Period - <span>{data.period}</span></span>
                            <span style={{ color: "#333" }}>Status - <span>Not Filed</span></span>
                            <span style={{ color: "#333" }}>Due Date - <span>{gstr1Due}</span></span>
                        </div>

                        {/* Summary success banner */}
                        {showSummaryBanner && (
                            <div className="gst-nil-success-banner" style={{ marginTop: 10 }}>
                                <span className="gst-nil-success-banner-check">✔</span>
                                Your Generate Summary request has been received. Please check the status in sometime by clicking on &apos;Refresh&apos; to view consolidated summary and file GSTR-1
                            </div>
                        )}

                        {/* File Nil GSTR-1 checkbox */}
                        <div className="gst-nil-checkbox-row" style={{ marginTop: 10 }}>
                            <input
                                id="nil-gstr1-check"
                                type="checkbox"
                                className="gst-nil-checkbox"
                                checked={nilGstr1Checked}
                                onChange={e => {
                                    setNilGstr1Checked(e.target.checked);
                                    setShowSummaryBanner(false);
                                }}
                            />
                            <label htmlFor="nil-gstr1-check" style={{ cursor: "pointer" }}>File Nil GSTR-1</label>
                        </div>

                        {nilGstr1Checked ? (
                            <>
                                {/* Note box */}
                                <div className="gst-nil-note-box">
                                    <p className="gst-nil-note-title">Note: NIL Form GSTR-1 can be filed by you if you have:</p>
                                    <ol className="gst-nil-note-list" type="a">
                                        <li>a. No Outward Supplies (including supplies on which tax is to be charged on reverse charge basis, zero rated supplies and deemed exports) during the month or quarter for which the form is being filed for</li>
                                        <li>b. No Amendments to be made to any of the supplies declared in an earlier form</li>
                                        <li>c. No Credit or Debit Notes to be declared / amended</li>
                                        <li>d. No details of advances received for services is to be declared or adjusted</li>
                                    </ol>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="gst-nil-record-section">
                                    <div
                                        className="gst-nil-record-header"
                                        onClick={() => setGstr1AddRecordOpen((open) => !open)}
                                    >
                                        <span>ADD RECORD DETAILS</span>
                                        <span>{gstr1AddRecordOpen ? "˄" : "˅"}</span>
                                    </div>
                                    {gstr1AddRecordOpen ? (
                                        <div className="gst-nil-record-grid">
                                            {GSTR1_RECORD_DETAIL_CARDS.map((title) => (
                                                <div key={title} className="gst-nil-record-card">
                                                    <div className="gst-nil-record-card-head">{title}</div>
                                                    <div className="gst-nil-record-card-body">
                                                        <span className="gst-nil-record-card-count">0</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                                <div className="gst-nil-record-section">
                                    <div
                                        className="gst-nil-record-header"
                                        onClick={() => setGstr1AmendRecordOpen((open) => !open)}
                                    >
                                        <span>AMEND RECORD DETAILS</span>
                                        <span>{gstr1AmendRecordOpen ? "˄" : "˅"}</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* E-invoicing info box */}
                        <div className="gst-nil-info-box-blue">
                            The taxpayers for whom e-invoicing is not applicable may ignore the sections/options related to e-invoice download. The downloaded file would be blank in case taxpayer is not e-invoicing or when e-invoices reported to IRP are yet to be processed by GST system
                        </div>

                        {/* E-Invoice accordion */}
                        <div className="gst-nil-accordion">
                            <div className="gst-nil-accordion-header" onClick={() => setAccordionOpen(o => !o)}>
                                <span>E-INVOICE DOWNLOAD HISTORY</span>
                                <span>{accordionOpen ? "˄" : "˅"}</span>
                            </div>
                            {accordionOpen && (
                                <div className="gst-nil-accordion-body">
                                    <div className="gst-nil-accordion-body-info">
                                        No files available for download
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Bottom buttons */}
                        <div className="gst-nil-bottom-btns">
                            <button className="gst-nil-btn outline" type="button" onClick={() => setScreen("returns-list")}>BACK</button>
                            <button className="gst-nil-btn" type="button">DOWNLOAD DETAILS FROM E-INVOICES (EXCEL)</button>
                            <button className="gst-nil-btn" type="button">PREVIEW</button>
                            <button className="gst-nil-btn outline" type="button">RESET</button>
                            <button className="gst-nil-btn" type="button" onClick={handleGstr1FileStatement}>
                                {nilGstr1Checked || showSummaryBanner ? "FILE STATEMENT" : "GENERATE SUMMARY"}
                            </button>
                        </div>
                    </div>
                </div>
            </GSTPortalChrome>
        );
    }

    // ── GSTR-1 FILING SCREEN ──────────────────────────────────────────────────
    if (screen === "gstr1-filing") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner">
                    <div className="gst-nil-breadcrumb">
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("dashboard")}>Dashboard</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("returns-list")}>Returns</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span>File</span>
                        <span className="gst-nil-language">🌐 English</span>
                    </div>

                    <div className="gst-nil-filing-wrap">
                        {/* Top info row */}
                        <div className="gst-nil-filing-info-row">
                            <span style={{ color: "#333" }}>GSTIN - <span style={{ color: "#e67e00" }}>{meta.gstin}</span></span>
                            <span style={{ color: "#333" }}>FY - <span style={{ color: "#e67e00" }}>{data.financialYear}</span></span>
                            <span style={{ color: "#333" }}>Legal Name - <span style={{ color: "#e67e00" }}>{meta.legalName}</span></span>
                            <span style={{ color: "#333" }}>Return Type - <span style={{ color: "#e67e00" }}>GSTR1</span></span>
                            <span style={{ color: "#333" }}>Return Period - <span style={{ color: "#e67e00" }}>{data.period}</span></span>
                            <span style={{ color: "#333" }}>Status - <span style={{ color: "#e67e00" }}>{gstr1Filed ? "Filed" : "Ready to File"}</span></span>
                        </div>

                        {/* Teal banner */}
                        <div className="gst-nil-teal-banner">
                            <span>Returns Filing for GST GSTR1</span>
                            <button className="gst-nil-banner-btn" type="button">↻</button>
                        </div>

                        <div className="gst-nil-filing-body">
                            {gstr1Filed && gstr1SuccessBanner && (
                                <div className="gst-nil-success-banner" style={{ marginBottom: 12 }}>
                                    <span className="gst-nil-success-banner-check">✔</span>
                                    GSTR1 of GSTIN - XXXXXXXXXX for the Return Period -{data.period} - {data.financialYear} has been successfully filed. The Acknowledgement Reference Number is xxxxxxxxxx . The GSTR1 can be viewed on your dashboard Login=&gt;Taxpayer Dashboard=&gt;Returns. This message is sent to your registered Email ID and Mobile Number.
                                </div>
                            )}

                            {/* Declaration */}
                            <div className="gst-nil-declaration-row">
                                <input
                                    type="checkbox"
                                    className="gst-nil-checkbox"
                                    readOnly
                                />
                                <span>
                                    I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my/our knowledge and belief and nothing has been concealed therefrom.
                                </span>
                            </div>

                            {/* Authorised signatory */}
                            <div className="gst-nil-signatory-label">
                                Authorised signatory <span>*</span>
                            </div>
                            <select
                                className="gst-nil-signatory-select"
                                value={gstr1Signatory}
                                onChange={e => setGstr1Signatory(e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value={meta.legalName}>{meta.legalName.charAt(0) + meta.legalName.slice(1).toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</option>
                            </select>

                            {/* Buttons */}
                            <div className="gst-nil-bottom-btns" style={{ marginTop: 18 }}>
                                <button className="gst-nil-btn outline" type="button" onClick={() => setScreen("gstr1-form")}>BACK</button>
                                <button className="gst-nil-btn" type="button">FILE WITH DSC</button>
                                <button className="gst-nil-btn" type="button" onClick={handleFileGstr1WithEvc}>FILE WITH EVC</button>
                            </div>

                            {/* DSC usage steps */}
                            <div className="gst-nil-dsc-section">
                                <p className="gst-nil-dsc-title">DSC Usage Steps:</p>
                                <ul className="gst-nil-dsc-list">
                                    <li>Run the emsigner as Administrator.</li>
                                    <li>open the portal, fill the appropriate Details got to till Update Register DSC</li>
                                    <li>Open a seperate tab in same browser and type https://127.0.0.1:1585</li>
                                    <li>Click on Advanced</li>
                                    <li>Click proceed to 127.0.0.1(Unsafe)</li>
                                    <li>Come back to GST portal, refresh the page</li>
                                    <li>Click on register DSC</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* OTP Modal */}
                {showGstr1OtpModal && (
                    <div className="gst-nil-modal-overlay">
                        <div className="gst-nil-otp-modal">
                            <div className="gst-nil-otp-modal-title">Validate One Time Password (OTP)</div>
                            <div className="gst-nil-otp-info-box">
                                One-Time Password (OTP) has been sent to your registered email ID exxxxxxxxxx@gmail.com and mobile no. 93xxxxxx22. OTP is valid Till {gstr1OtpValidUntil || "—"}
                            </div>
                            <label className="gst-nil-otp-input-label">
                                Enter One Time Password (OTP:{FIXED_OTP})
                            </label>
                            <input
                                className={`gst-nil-otp-input${gstr1OtpError ? " has-error" : ""}`}
                                type="text"
                                maxLength={6}
                                value={gstr1OtpInput}
                                onChange={e => { setGstr1OtpInput(e.target.value); setGstr1OtpError(""); }}
                            />
                            {gstr1OtpError && <div className="gst-nil-otp-error">{gstr1OtpError}</div>}
                            <div className="gst-nil-otp-btn-row">
                                <button className="gst-nil-otp-btn" type="button" onClick={() => setShowGstr1OtpModal(false)}>CANCEL</button>
                                <button className="gst-nil-otp-btn primary" type="button" onClick={handleVerifyGstr1Otp}>VERIFY</button>
                                <button className="gst-nil-otp-btn" type="button">RESEND OTP</button>
                                <span className="gst-nil-otp-timer">30S</span>
                            </div>
                            <p className="gst-nil-otp-resend-note">
                                If you do not receive the OTP within 30 seconds, please click &quot;RESEND OTP&quot; button to request same OTP again. Resend request can be made maximum three times.
                            </p>
                        </div>
                    </div>
                )}

                {/* GSTR-1 success modal */}
                {showGstr1SuccessModal && (
                    <div className="gst-nil-modal-overlay">
                        <div className="gst-nil-success-modal">
                            <div className="gst-nil-success-modal-header">
                                <div className="gst-nil-success-modal-title">
                                    <span>✔</span>
                                    GSTR1 Return Filing Completed
                                </div>
                                <button className="gst-nil-success-modal-close" type="button" onClick={handleGstr1SuccessClose}>✕</button>
                            </div>
                            <div className="gst-nil-success-modal-body">
                                Please file GSTR3B to complete the task
                            </div>
                        </div>
                    </div>
                )}
            </GSTPortalChrome>
        );
    }

    // ── GSTR-3B FORM SCREEN ───────────────────────────────────────────────────
    if (screen === "gstr3b-form") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner">
                    <div className="gst-nil-breadcrumb">
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("dashboard")}>Dashboard</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("returns-list")}>Returns</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span>GSTR-3B</span>
                        <span className="gst-nil-language">🌐 English</span>
                    </div>

                    <div className="gst-nil-form-wrap">
                        <h3 className="gst-nil-gstr3b-title">GSTR-3B - Monthly Return</h3>

                        {/* Info row */}
                        <div className="gst-nil-info-row">
                            <span style={{ color: "#333" }}>GSTIN - <span style={{ color: "#e67e00" }}>{meta.gstin}</span></span>
                            <span style={{ color: "#333" }}>FY - <span style={{ color: "#e67e00" }}>{data.financialYear}</span></span>
                            <span style={{ color: "#333" }}>Legal Name - <span style={{ color: "#e67e00" }}>{meta.legalName}</span></span>
                            <span style={{ color: "#333" }}>Status - <span style={{ color: "#e67e00" }}>Not Filed</span></span>
                            <span style={{ color: "#333" }}>Return Period - <span style={{ color: "#e67e00" }}>{data.period}</span></span>
                            <span style={{ color: "#333" }}>Due Date - <span style={{ color: "#e67e00" }}>{gstr3bDue}</span></span>
                        </div>

                        {/* Warning if GSTR-1 not filed */}
                        {!gstr1Filed && (
                            <div className="gst-nil-alert-red">
                                you have not filed GSTR-1, Please file the same at the earliest.
                            </div>
                        )}

                        <div className="gst-nil-mandatory-row"><span>●</span> indicates mandatory fields</div>

                        {/* Nil return question */}
                        <div className="gst-nil-nil-question-box">
                            <div className="gst-nil-nil-question-left">
                                <div className="gst-nil-nil-question-label">
                                    Do you want to file Nil return? <span>*</span>
                                </div>
                                <p className="gst-nil-nil-note-title">
                                    <em>Nil Form GSTR-3B for a tax period can be filled if you:</em>
                                </p>
                                <ul className="gst-nil-nil-note-list">
                                    <li>Have NOT made any Outward supplies and</li>
                                    <li>Have NOT received any inward supplies and</li>
                                    <li>Do NOT have any liability for the particular tax period.</li>
                                </ul>
                            </div>
                            <div className="gst-nil-nil-question-right">
                                <label className="gst-nil-radio-label">
                                    <input type="radio" name="nil-return" checked={nilReturn3bYes} onChange={() => setNilReturn3bYes(true)} />
                                    Yes
                                </label>
                                <label className="gst-nil-radio-label">
                                    <input type="radio" name="nil-return" checked={!nilReturn3bYes} onChange={() => setNilReturn3bYes(false)} />
                                    No
                                </label>
                            </div>
                        </div>

                        <div className="gst-nil-bottom-btns">
                            <button className="gst-nil-btn outline" type="button" onClick={() => setScreen("returns-list")}>BACK</button>
                            <button className="gst-nil-btn" type="button" onClick={() => setScreen("gstr3b-filing")}>NEXT</button>
                        </div>
                    </div>
                </div>
            </GSTPortalChrome>
        );
    }

    // ── GSTR-3B FILING SCREEN ─────────────────────────────────────────────────
    if (screen === "gstr3b-filing") {
        return (
            <GSTPortalChrome
                questionBadge={questionBadge}
                loggedIn
                legalName={meta.legalName}
                gstin={meta.gstin}
                backHref={backHref}
                onLoginClick={() => setScreen("login")}
            >
                <div className="gst-nil-inner">
                    <div className="gst-nil-breadcrumb">
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("dashboard")}>Dashboard</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("returns-list")}>Returns</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span style={{ color: "#2d5da8", cursor: "pointer" }} onClick={() => setScreen("gstr3b-form")}>GSTR-3B</span>
                        <span className="gst-nil-breadcrumb-sep">›</span>
                        <span>Filing of Tax</span>
                        <span className="gst-nil-language">🌐 English</span>
                    </div>

                    <div className="gst-nil-filing-wrap">
                        <div className="gst-nil-filing-body" style={{ border: "1px solid #ddd" }}>
                            {/* Declaration */}
                            <div className="gst-nil-declaration-row">
                                <input type="checkbox" className="gst-nil-checkbox" readOnly />
                                <span>
                                    I/We hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my/our knowledge and belief and nothing has been concealed therefrom.
                                </span>
                            </div>

                            {/* Authorised signatory */}
                            <div className="gst-nil-signatory-label">
                                Authorised signatory <span>*</span>
                            </div>
                            <select
                                className="gst-nil-signatory-select"
                                value={gstr3bSignatory}
                                onChange={e => setGstr3bSignatory(e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value={meta.legalName}>{meta.legalName.charAt(0) + meta.legalName.slice(1).toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</option>
                            </select>

                            {/* Buttons */}
                            <div className="gst-nil-bottom-btns" style={{ marginTop: 18 }}>
                                <button className="gst-nil-btn outline" type="button" onClick={() => setScreen("gstr3b-form")}>BACK</button>
                                <button className="gst-nil-btn pink" type="button">SYSTEM GENERATED GSTR-3B</button>
                                <button className="gst-nil-btn" type="button">PREVIEW DRAFT GSTR-3B</button>
                                <button className="gst-nil-btn" type="button" onClick={handleFileGstr3bWithEvc}>FILE GSTR-3B WITH EVC</button>
                                <button className="gst-nil-btn" type="button">FILE GSTR-3B WITH DSC</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warning modal */}
                {showGstr3bWarning && (
                    <div className="gst-nil-modal-overlay">
                        <div className="gst-nil-warning-modal">
                            <div className="gst-nil-warning-icon">!</div>
                            <p className="gst-nil-warning-title">Warning</p>
                            <p className="gst-nil-warning-text">
                                You have not filed GSTR-1 of the selected tax period.<br />
                                Please file the same to enable filing of GSTR-3B.
                            </p>
                            <button className="gst-nil-warning-ok-btn" type="button" onClick={() => setShowGstr3bWarning(false)}>OK</button>
                        </div>
                    </div>
                )}

                {/* OTP Modal */}
                {showGstr3bOtpModal && (
                    <div className="gst-nil-modal-overlay">
                        <div className="gst-nil-otp-modal">
                            <div className="gst-nil-otp-modal-title">Validate One Time Password (OTP)</div>
                            <div className="gst-nil-otp-info-box">
                                One-Time Password (OTP) has been sent to your registered email ID exxxxxxxxxx@gmail.com and mobile no. 93xxxxxx22. OTP is valid Till {gstr3bOtpValidUntil || "—"}
                            </div>
                            <label className="gst-nil-otp-input-label">
                                Enter One Time Password (OTP:{FIXED_OTP})
                            </label>
                            <input
                                className={`gst-nil-otp-input${gstr3bOtpError ? " has-error" : ""}`}
                                type="text"
                                maxLength={6}
                                value={gstr3bOtpInput}
                                onChange={e => { setGstr3bOtpInput(e.target.value); setGstr3bOtpError(""); }}
                            />
                            {gstr3bOtpError && <div className="gst-nil-otp-error">{gstr3bOtpError}</div>}
                            <div className="gst-nil-otp-btn-row">
                                <button className="gst-nil-otp-btn" type="button" onClick={() => setShowGstr3bOtpModal(false)}>CANCEL</button>
                                <button className="gst-nil-otp-btn primary" type="button" onClick={handleVerifyGstr3bOtp}>VERIFY</button>
                                <button className="gst-nil-otp-btn" type="button">RESEND OTP</button>
                                <span className="gst-nil-otp-timer">30S</span>
                            </div>
                            <p className="gst-nil-otp-resend-note">
                                If you do not receive the OTP within 30 seconds, please click &quot;RESEND OTP&quot; button to request same OTP again. Resend request can be made maximum three times.
                            </p>
                        </div>
                    </div>
                )}

                {/* Filing successful modal */}
                {showFilingSuccess && (
                    <div className="gst-nil-modal-overlay">
                        <div className="gst-nil-filing-success-modal">
                            <div className="gst-nil-filing-success-figure">🏃</div>
                            <div className="gst-nil-filing-success-body">
                                <h3 className="gst-nil-filing-success-title">Filing Successful</h3>
                                <p className="gst-nil-filing-success-text">
                                    GSTR-3B of GSTIN {meta.gstin} for the period {data.period} - {data.financialYear} has been successfully filed on {filingSuccessMeta?.date ?? "—"} at {filingSuccessMeta?.time ?? "—"}. The Acknowledgment Reference Number : is {filingSuccessMeta?.arn ?? "—"}. The GSTR-3B can be viewed on your Dashboard Login=&gt;Taxpayer Dashboard=&gt;Returns=&gt;View e-filed return. This message is sent to your registered Email ID and Mobile Number.
                                </p>
                                <button className="gst-nil-well-done-btn" type="button" onClick={handleWellDone}>
                                    Well Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </GSTPortalChrome>
        );
    }

    // ── RETURNS LIST (used after GSTR-1 success) ──────────────────────────────
    // Fallback: redirect to file-returns
    setScreen("file-returns");
    return null;
}
