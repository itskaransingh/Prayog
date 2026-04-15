"use client";

import { ChevronUp, Mail, Lock } from "lucide-react";
import Link from "next/link";
import {
    useEffect,
    useRef,
    useState,
    type InputHTMLAttributes,
    type ReactNode,
} from "react";

import { TrnCaptcha } from "@/components/simulation/gst/shared/trn-captcha";
import { EvaluationPopup } from "@/components/simulation/income-tax/shared/evaluation-results";
import { evaluateRegistration, type EvaluationResult } from "@/lib/evaluation";
import {
    buildAttemptAnswers,
    saveSimulationAttempt,
    type PersistableEvaluationMapping,
} from "@/lib/simulation/attempts";
import type { SimulationEvaluationConfig } from "@/lib/simulation/runtime-evaluation";
import {
    EMPTY_GSTIN_REGISTRATION_DATA,
    GSTIN_CONSTITUTION_OPTIONS,
    GSTIN_DESIGNATION_OPTIONS,
    GSTIN_REASON_OPTIONS,
    GSTIN_NATURE_OF_POSSESSION_OPTIONS,
    GSTIN_DOCUMENT_TYPE_OPTIONS,
    type GstinRegistrationData,
} from "@/lib/simulation/gst/gstin-registration";
import {
    TRN_STATE_OPTIONS,
    getDistrictOptions,
} from "@/lib/simulation/gst/trn-registration";

// ─── Constants ───────────────────────────────────────────────────────────────

const GST_FOOTER_COLUMNS = [
    { title: "About GST",     items: ["GST Council Structure", "GST History"] },
    { title: "Website Policies", items: ["Website Policy", "Terms and Conditions", "Hyperlink Policy", "Disclaimer"] },
    { title: "Related Sites", items: ["Central Board of Indirect Taxes and Customs", "State Tax Websites", "National Portal"] },
    { title: "Help and Taxpayer Facilities", items: ["System Requirements", "GST Knowledge Portal", "GST Media", "Site Map", "Grievance Nodal Officers", "Free Accounting and Billing Services", "GST Suvidha Providers"] },
] as const;

const GSTIN_MAPPING_CACHE_PREFIX = "gst-gstin-simulation-mappings:";

const TABS = [
    { id: 1,  label: "Business Details" },
    { id: 2,  label: "Promoter\nPartners" },
    { id: 3,  label: "Authorized\nSignatory" },
    { id: 4,  label: "Authorized\nRepresentative" },
    { id: 5,  label: "Principal Place\nof Business" },
    { id: 6,  label: "Additional Places\nof Business" },
    { id: 7,  label: "Goods And\nServices" },
    { id: 8,  label: "State Specific\nInformation" },
    { id: 9,  label: "Aadhaar\nAuthentication" },
    { id: 10, label: "Verification" },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface GSTGstinRegistrationClientProps {
    questionId: string | null;
    initialMode: string | null;
}

interface ValidationErrors {
    trn?: string;
    captcha?: string;
    otp?: string;
    constitutionOfBusiness?: string;
    dateOfCommencement?: string;
    reasonForRegistration?: string;
    ward?: string;
    commissionerate?: string;
    division?: string;
    range?: string;
    proprietorFirstName?: string;
    proprietorFatherFirstName?: string;
    proprietorDob?: string;
    proprietorMobile?: string;
    proprietorEmail?: string;
    proprietorAadhaar?: string;
    proprietorDesignation?: string;
    residentialFlatNo?: string;
    residentialFloor?: string;
    residentialBuilding?: string;
    residentialStreet?: string;
    residentialCity?: string;
    residentialDistrict?: string;
    residentialState?: string;
    residentialPin?: string;
    businessFlatNo?: string;
    businessBuilding?: string;
    businessFloor?: string;
    businessStreet?: string;
    businessCity?: string;
    businessDistrict?: string;
    businessState?: string;
    businessPin?: string;
    businessEmail?: string;
    hsn?: string;
    verificationName?: string;
    verificationPlace?: string;
}

// ─── Cache helpers ───────────────────────────────────────────────────────────

function getCachedMappings(questionId: string | null): PersistableEvaluationMapping[] {
    if (typeof window === "undefined" || !questionId) return [];
    try {
        const raw = window.localStorage.getItem(`${GSTIN_MAPPING_CACHE_PREFIX}${questionId}`);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as PersistableEvaluationMapping[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function buildQuestionBadge(title: string | null, questionId: string | null) {
    if (title?.trim()) return title.trim();
    if (questionId) return questionId.slice(0, 8).toUpperCase();
    return "GST_REG";
}

// ─── Shared UI atoms ─────────────────────────────────────────────────────────

function GSTSelect({
    value, placeholder, options, hasError, onChange,
}: {
    value: string; placeholder: string; options: readonly string[];
    hasError: boolean; onChange: (v: string) => void;
}) {
    return (
        <div className={`gst-trn-select-wrap${hasError ? " has-error" : ""}`}>
            <select className="gst-trn-select" value={value} onChange={(e) => onChange(e.target.value)}>
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
        </div>
    );
}

function GSTInput({
    value, placeholder, hasError, type = "text", maxLength, inputMode, autoComplete, prefix, icon, onChange,
}: {
    value: string; placeholder: string; hasError: boolean;
    type?: string; maxLength?: number;
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
    autoComplete?: string; prefix?: string; icon?: ReactNode;
    onChange: (v: string) => void;
}) {
    return (
        <div className={`gst-trn-input-wrap${hasError ? " has-error" : ""}`}>
            {icon   ? <span className="gst-trn-input-icon">{icon}</span>     : null}
            {prefix ? <span className="gst-trn-input-prefix">{prefix}</span> : null}
            <input
                className="gst-trn-input"
                value={value}
                placeholder={placeholder}
                type={type}
                maxLength={maxLength}
                inputMode={inputMode}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}

function GSTFieldError({ message }: { message?: string }) {
    return message ? <p className="gst-trn-field-error">{message}</p> : null;
}

function FieldBlock({ label, required, children, error }: {
    label: string; required?: boolean; children: ReactNode; error?: string;
}) {
    return (
        <div className="gst-trn-field-block">
            <label>{label}{required ? <span> *</span> : null}</label>
            {children}
            <GSTFieldError message={error} />
        </div>
    );
}

function GSTReadonlyField({ value }: { value: string }) {
    return (
        <div className="gst-trn-input-wrap gstin-readonly-input">
            <input className="gst-trn-input" value={value || "—"} readOnly />
        </div>
    );
}

function GSTStaticInput({
    value,
    placeholder,
}: {
    value?: string;
    placeholder?: string;
}) {
    return (
        <div className="gst-trn-input-wrap">
            <input
                className="gst-trn-input"
                value={value ?? ""}
                placeholder={placeholder ?? ""}
                readOnly
            />
        </div>
    );
}

// ─── Portal Chrome ────────────────────────────────────────────────────────────

function GSTPortalChrome({ questionBadge, registerHref, children }: {
    questionBadge: string; registerHref: string; children: ReactNode;
}) {
    return (
        <div className="gst-sim-page gst-trn-page">
            <div className="gst-sim-top-banner gst-trn-top-banner">
                <span>Simulated website - For Educational purpose only</span>
                <span className="gst-trn-question-badge">Question No: {questionBadge}</span>
            </div>

            <div className="gst-sim-access-strip">
                <div className="gst-sim-access-inner">
                    <span>Skip to Main Content</span>
                    <span>0</span><span>A+</span><span>A-</span>
                </div>
            </div>

            <header className="gst-sim-header">
                <div className="gst-sim-header-inner gst-trn-header-inner">
                    <div className="gst-trn-brand-strip">
                        <div className="gst-trn-nergy-logo">Nergy Vidya</div>
                        <div className="gst-sim-brand">
                            <h1>Goods and Services Tax</h1>
                            <p>Government of India, States and Union Territories</p>
                        </div>
                    </div>
                    <div className="gst-sim-auth gst-trn-auth" aria-hidden="true">
                        <button type="button">REGISTER</button>
                        <button type="button">LOGIN</button>
                    </div>
                </div>
            </header>

            <nav className="gst-sim-nav" aria-label="GST portal">
                <div className="gst-sim-nav-inner gst-trn-nav-inner">
                    {["Home","Services","Dashboard","GST Law","Downloads","Search Taxpayer","Help and Taxpayer Facilities","e-Invoice","News and Updates"].map((item, i) => (
                        <span key={item} className={i === 0 ? "is-active" : undefined}>
                            {item}
                            {(item === "Services" || item === "Downloads") ? <small>▼</small> : null}
                        </span>
                    ))}
                </div>
            </nav>

            {children}

            <footer className="gst-sim-footer gst-trn-footer">
                <div className="gst-sim-footer-main">
                    {GST_FOOTER_COLUMNS.map((col) => (
                        <section key={col.title} className="gst-sim-footer-column">
                            <h2>{col.title}</h2>
                            <ul>{col.items.map((item) => <li key={item}><a href="#">{item}</a></li>)}</ul>
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
                    <Link className="gst-sim-top-button" href={registerHref}>
                        <ChevronUp size={24} strokeWidth={2.6} /><span>Top</span>
                    </Link>
                </div>
            </footer>
        </div>
    );
}

// ─── Landing page (reused from TRN) ──────────────────────────────────────────

function GSTGstinLanding({ registerHref }: { registerHref: string }) {
    return (
        <>
            <section className="gst-sim-hero" aria-hidden="true" />
            <main id="main-content" className="gst-sim-main">
                <section className="gst-sim-lower-grid">
                    <div className="gst-sim-cta-stack">
                        <Link className="gst-sim-register-link" href={registerHref}>
                            <Lock size={12} strokeWidth={2.25} />
                            <span>Register Now</span>
                        </Link>
                        <div className="gst-sim-secondary-panel" aria-hidden="true" />
                    </div>
                    <div className="gst-sim-service-grid" aria-hidden="true">
                        {["Registration Services","Return Dashboard","Compliance Tools","Filing Support"].map((t) => (
                            <article key={t} className="gst-sim-service-card">
                                <div className="gst-sim-service-title">{t}</div>
                                <div className="gst-sim-service-list"><span/><span/><span/><span/></div>
                            </article>
                        ))}
                    </div>
                </section>
            </main>
        </>
    );
}

// ─── Radio UI ─────────────────────────────────────────────────────────────────

function GSTRadio({ checked, label }: { checked: boolean; label: string }) {
    return (
        <label className="gst-trn-radio">
            <span className={`gst-trn-radio-mark${checked ? " is-checked" : ""}`} aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

// ─── Tab icons (inline SVG) ───────────────────────────────────────────────────

function TabIcon({ id }: { id: number }) {
    switch (id) {
        case 1: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="7" width="18" height="14" rx="1"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        );
        case 2: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="7" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/></svg>
        );
        case 3: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2.5"/><path d="M2 21v-1.5A6.5 6.5 0 0 1 9 13h1"/><path d="M13 21v-1a5 5 0 0 1 10 0v1"/></svg>
        );
        case 4: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 21s-8-7.5-8-12a8 8 0 1 1 16 0c0 4.5-8 12-8 12z"/><circle cx="12" cy="9" r="2.5"/></svg>
        );
        case 5: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 21s-5-5-5-9a5 5 0 0 1 10 0c0 4-5 9-5 9z"/><path d="M16 10.5s-3-3-3-5.5a3 3 0 0 1 6 0c0 2.5-3 5.5-3 5.5z"/></svg>
        );
        case 6: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="8" width="20" height="14" rx="1"/><path d="M16 8V6a4 4 0 0 0-8 0v2"/></svg>
        );
        case 7: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        );
        case 8: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2a4 4 0 0 1 4 4v1M8 6V5a4 4 0 0 1 7.2-2.4"/><path d="M4 10a8 8 0 0 1 16 0c0 4.5-2 8-8 12C6 18 4 14.5 4 10z"/></svg>
        );
        case 9: return (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>
        );
        default: return null;
    }
}

// ─── Tab header for multi-tab form ───────────────────────────────────────────

function GstinFormHeader({ activeTab, completedTabs, applicationDate }: {
    activeTab: number; completedTabs: Set<number>; applicationDate: string;
}) {
    const profile = Math.round((completedTabs.size / TABS.length) * 100);

    return (
        <div className="gstin-form-header">
            <div className="gstin-form-warn-banner">
                ⚠ Before continuing, fill the Aadhaar number and verify. Primary Authorized Signatory should be authenticated by DSC or e-Sign.
            </div>
            <div className="gstin-form-meta-row">
                <div className="gstin-form-meta-item">
                    <span className="gstin-form-meta-label">Application Type</span>
                    <span className="gstin-form-meta-value">New Registration</span>
                </div>
                <div className="gstin-form-meta-item">
                    <span className="gstin-form-meta-label">Due Date to Complete</span>
                    <span className="gstin-form-meta-value">{applicationDate}</span>
                </div>
                <div className="gstin-form-meta-item">
                    <span className="gstin-form-meta-label">Last Modified</span>
                    <span className="gstin-form-meta-value">{applicationDate}</span>
                </div>
                <div className="gstin-form-meta-item">
                    <span className="gstin-form-meta-label">Profile</span>
                    <span className="gstin-form-meta-value gstin-form-meta-profile">{profile}%</span>
                </div>
            </div>
            <div className="gstin-tab-nav" role="tablist">
                {TABS.map((tab) => {
                    const isDone   = completedTabs.has(tab.id);
                    const isActive = activeTab === tab.id;
                    return (
                        <div
                            key={tab.id}
                            role="tab"
                            className={`gstin-tab-item${isActive ? " is-active" : ""}${isDone ? " is-done" : ""}`}
                        >
                            <div className="gstin-tab-icon">
                                {isDone
                                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="20 6 9 17 4 12"/></svg>
                                    : <TabIcon id={tab.id} />}
                            </div>
                            <span className="gstin-tab-label">{tab.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Bottom action bar ────────────────────────────────────────────────────────

function GstinTabActions({
    onBack, onSave, isFirst, saveLabel = "SAVE & CONTINUE",
}: {
    onBack?: () => void; onSave: () => void;
    isFirst?: boolean; saveLabel?: string;
}) {
    return (
        <div className="gstin-tab-actions">
            {!isFirst && (
                <button type="button" className="gst-trn-secondary-button" onClick={onBack}>
                    BACK
                </button>
            )}
            <button type="button" className="gstin-save-btn" onClick={onSave}>
                {saveLabel}
            </button>
        </div>
    );
}

// ─── My Saved Applications screen ────────────────────────────────────────────

function MySavedApplications({
    applicationDate, onEdit,
}: {
    applicationDate: string; onEdit: () => void;
}) {
    return (
        <main className="gst-trn-main-shell">
            <div className="gst-trn-breadcrumb-row">
                <span>Home</span>
                <span className="gst-trn-breadcrumb-sep">›</span>
                <span>Dashboard</span>
                <span className="gst-trn-language">English</span>
            </div>

            <div className="gstin-saved-apps-card">
                <h2 className="gstin-saved-apps-title">My Saved Applications</h2>
                <div className="gstin-saved-apps-table-wrap">
                    <table className="gstin-saved-apps-table">
                        <thead>
                            <tr>
                                <th>Creation Date</th>
                                <th>Form Number</th>
                                <th>Form Description</th>
                                <th>Expiry Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>{applicationDate}</td>
                                <td>GST REG-01</td>
                                <td>Application for New Registration</td>
                                <td>{applicationDate}</td>
                                <td><span className="gstin-draft-badge">Draft</span></td>
                                <td>
                                    <button
                                        type="button"
                                        className="gstin-edit-btn"
                                        onClick={onEdit}
                                        title="Edit application"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <h2 className="gstin-saved-apps-title" style={{ marginTop: "28px" }}>Track Application Status</h2>
                <p className="gstin-no-track">You do not have any submitted applications.</p>
            </div>
        </main>
    );
}

// ─── The main simulator ───────────────────────────────────────────────────────

function GSTGstinSimulator({
    questionId,
    onQuestionTitleChange,
}: {
    questionId: string;
    onQuestionTitleChange: (title: string | null) => void;
}) {
    const [mappings, setMappings] = useState<PersistableEvaluationMapping[]>(() => getCachedMappings(questionId));
    const [taskId, setTaskId] = useState<string | null>(null);
    const [showExpectedAnswersInEvaluation, setShowExpectedAnswersInEvaluation] = useState(false);

    // Stages: "trn" | "otp" | "saved-apps" | "form" | "done"
    const [stage, setStage] = useState<"trn" | "otp" | "saved-apps" | "form" | "done">("trn");
    const [activeTab, setActiveTab] = useState(1);
    const [completedTabs, setCompletedTabs] = useState<Set<number>>(new Set());

    const [data, setData] = useState<GstinRegistrationData>(EMPTY_GSTIN_REGISTRATION_DATA);
    const [errors, setErrors] = useState<ValidationErrors>({});

    const [isCompleted, setIsCompleted] = useState(false);
    const [evaluationResults, setEvaluationResults] = useState<EvaluationResult | null>(null);
    const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [startTime] = useState<number>(() => Date.now());
    const [goodsMode, setGoodsMode] = useState<"goods" | "services">("goods");
    const hasSavedAttemptRef = useRef(false);

    const applicationDate = new Date().toLocaleDateString("en-GB").replace(/\//g, "/");
    const residentialDistrictOptions = getDistrictOptions(data.residentialState);
    const businessDistrictOptions = getDistrictOptions(data.businessState);
    const currentBreadcrumb =
        stage === "form"
            ? (TABS.find((tab) => tab.id === activeTab)?.label ?? "Registration").replace(/\n/g, " ")
            : "Registration";

    // Load evaluation config
    useEffect(() => {
        async function loadConfig() {
            try {
                const res = await fetch(`/api/simulation/questions/${questionId}/evaluation-config`, { cache: "no-store" });
                if (!res.ok) throw new Error("Failed to fetch config");
                const config = (await res.json()) as SimulationEvaluationConfig;
                setTaskId(config.taskId);
                onQuestionTitleChange(config.questionTitle ?? null);
                setShowExpectedAnswersInEvaluation(config.showExpectedAnswersInEvaluation);
                setMappings(config.mappings);
                try {
                    window.localStorage.setItem(`${GSTIN_MAPPING_CACHE_PREFIX}${questionId}`, JSON.stringify(config.mappings));
                } catch { /* ignore */ }
            } catch (err) {
                console.error(err);
            }
        }
        void loadConfig();
    }, [onQuestionTitleChange, questionId]);

    useEffect(() => {
        if (mappings.length === 0) {
            return;
        }

        const byFieldPath = new Map(
            mappings.map((mapping) => [mapping.fieldPath, mapping.expectedValue]),
        );

        setData((prev) => ({
            ...prev,
            legalBusinessName:
                prev.legalBusinessName ||
                byFieldPath.get("legalBusinessName") ||
                "",
            registeredState:
                prev.registeredState || byFieldPath.get("registeredState") || "",
            registeredDistrict:
                prev.registeredDistrict ||
                byFieldPath.get("registeredDistrict") ||
                "",
            proprietorPan:
                prev.proprietorPan || byFieldPath.get("proprietorPan") || "",
        }));
    }, [mappings]);

    // Persist attempt
    useEffect(() => {
        async function persist() {
            if (!isCompleted || !evaluationResults || hasSavedAttemptRef.current) return;
            hasSavedAttemptRef.current = true;
            setSaveError(null);
            try {
                await saveSimulationAttempt({
                    questionId,
                    taskId,
                    startTime,
                    endTime: startTime + evaluationResults.timeTakenSeconds * 1000,
                    answers: buildAttemptAnswers(data, mappings),
                });
            } catch (err) {
                hasSavedAttemptRef.current = false;
                setSaveError(err instanceof Error ? err.message : "Failed to save attempt.");
            }
        }
        void persist();
    }, [data, evaluationResults, isCompleted, mappings, questionId, startTime, taskId]);

    // ── Derived values from mappings ─────────────────────────────────────────
    const captchaCode = mappings.find((m) => m.fieldPath === "captcha")?.expectedValue ?? "GST40";
    const expectedOtp  = mappings.find((m) => m.fieldPath === "otp")?.expectedValue     ?? "123456";
    const expectedTrn  = mappings.find((m) => m.fieldPath === "trn")?.expectedValue     ?? "";

    // ── Field updater ─────────────────────────────────────────────────────────
    function updateField<K extends keyof GstinRegistrationData>(key: K, value: GstinRegistrationData[K]) {
        setData((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    }

    // ── Step 1 validation ─────────────────────────────────────────────────────
    function handleProceedTrn() {
        const nextErrors: ValidationErrors = {};
        if (!data.trn.trim()) nextErrors.trn = "TRN is required";
        else if (expectedTrn && data.trn.trim() !== expectedTrn) nextErrors.trn = "Invalid TRN";
        if (!data.captcha.trim()) nextErrors.captcha = "Captcha is required";
        else if (data.captcha.trim().toUpperCase() !== captchaCode.toUpperCase())
            nextErrors.captcha = "Captcha does not match";

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) setStage("otp");
    }

    // ── Step 2 validation ─────────────────────────────────────────────────────
    function handleProceedOtp() {
        const nextErrors: ValidationErrors = {};
        if (!data.otp.trim()) nextErrors.otp = "OTP is required";
        else if (data.otp.trim() !== expectedOtp) nextErrors.otp = "Incorrect OTP";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) setStage("saved-apps");
    }

    // ── Tab navigation ────────────────────────────────────────────────────────
    function completeTab(tabId: number) {
        setCompletedTabs((prev) => new Set([...prev, tabId]));
        if (tabId < TABS.length) {
            setActiveTab(tabId + 1);
        } else {
            handleFinalSubmit();
        }
    }

    function validateTab(tabId: number): ValidationErrors {
        const nextErrors: ValidationErrors = {};
        const req = (field: keyof ValidationErrors, label: string) => {
            if (!((data as Record<string, unknown>)[field] as string)?.trim())
                nextErrors[field] = `${label} is required`;
        };

        if (tabId === 1) {
            req("constitutionOfBusiness", "Constitution of Business");
            req("dateOfCommencement", "Date of Commencement");
            req("reasonForRegistration", "Reason for Registration");
            req("ward", "Ward");
            req("commissionerate", "Commissionerate");
            req("division", "Division");
            req("range", "Range");
        }
        if (tabId === 2) {
            req("proprietorFirstName", "First Name");
            req("proprietorFatherFirstName", "Father's First Name");
            req("proprietorDob", "Date of Birth");
            req("proprietorMobile", "Mobile Number");
            req("proprietorEmail", "Email Address");
            req("proprietorAadhaar", "Aadhaar Number");
            req("proprietorDesignation", "Designation");
            req("residentialFlatNo", "Flat No");
            req("residentialFloor", "Floor No");
            req("residentialBuilding", "Building Name");
            req("residentialStreet", "Street/Road");
            req("residentialCity", "City/Town/Village");
            req("residentialDistrict", "District");
            req("residentialState", "State");
            req("residentialPin", "Pin Code");
        }
        if (tabId === 4) {
            req("businessFlatNo", "Flat No");
            req("businessBuilding", "Building Name");
            req("businessFloor", "Floor No");
            req("businessStreet", "Street/Road");
            req("businessCity", "City/Town/Village");
            req("businessDistrict", "District");
            req("businessState", "State");
            req("businessPin", "Pin Code");
            req("businessEmail", "Office Email Address");
        }
        if (tabId === 6) {
            req("hsn", "HSN Code");
        }
        if (tabId === 10) {
            req("verificationName", "Name of Authorized Signatory");
            req("verificationPlace", "Place");
        }
        return nextErrors;
    }

    function handleTabSave(tabId: number) {
        const nextErrors = validateTab(tabId);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length === 0) completeTab(tabId);
    }

    // ── Final submit ──────────────────────────────────────────────────────────
    function handleFinalSubmit() {
        const endTime = Date.now();
        const results = evaluateRegistration(data, startTime, endTime, mappings);
        setEvaluationResults(results);
        setIsCompleted(true);
        setStage("done");
        setShowSuccessModal(true);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DONE state
    // ─────────────────────────────────────────────────────────────────────────
    if (stage === "done" && evaluationResults) {
        return (
            <>
                <main className="gst-trn-main-shell">
                    <div className="gst-trn-breadcrumb-row">
                        <span>Home</span>
                        <span className="gst-trn-breadcrumb-sep">›</span>
                        <span>Registration</span>
                        <span className="gst-trn-language">English</span>
                    </div>
                    {saveError ? <div className="gst-trn-save-error">{saveError}</div> : null}
                    <section className="gst-trn-success-shell">
                        <div className="gst-trn-success-banner">
                            Your GST registration application has been submitted successfully. Your Application Reference Number (ARN) will be generated shortly.
                        </div>
                        <div className="gst-trn-success-body">
                            <p>
                                You have successfully completed the GST Registration (Part B). The application is now pending verification by the GST Officer. You will receive a confirmation on your registered mobile and email.
                            </p>
                            <button type="button" className="gst-trn-success-proceed">PROCEED</button>
                        </div>
                    </section>
                </main>

                {showSuccessModal ? (
                    <div className="gst-trn-success-modal-backdrop">
                        <div className="gst-trn-success-modal">
                            <div className="gst-trn-success-figure" aria-hidden="true">
                                <div className="gst-trn-success-figure-circle" />
                                <div className="gst-trn-success-figure-body" />
                            </div>
                            <h2>Congratulations!</h2>
                            <p>You have successfully completed the GST Registration.</p>
                            <button
                                type="button"
                                className="gst-trn-success-action"
                                onClick={() => { setShowSuccessModal(false); setShowEvaluationPopup(true); }}
                            >
                                Well Done
                            </button>
                        </div>
                    </div>
                ) : null}

                <EvaluationPopup
                    open={showEvaluationPopup}
                    results={evaluationResults}
                    onClose={() => setShowEvaluationPopup(false)}
                    showExpectedValues={showExpectedAnswersInEvaluation}
                />
            </>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // My Saved Applications
    // ─────────────────────────────────────────────────────────────────────────
    if (stage === "saved-apps") {
        return (
            <MySavedApplications
                applicationDate={applicationDate}
                onEdit={() => { setStage("form"); setActiveTab(1); }}
            />
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Multi-tab form
    // ─────────────────────────────────────────────────────────────────────────
    if (stage === "form") {
        const businessActivities = [
            "Bonded Warehouse",
            "Factory / Manufacturing",
            "Leasing Business",
            "Retail Business",
            "Works Contract",
            "EOU / STP / EHTP",
            "Import",
            "Office / Sale Office",
            "Warehouse / Depot",
            "Others (Please Specify)",
            "Export",
            "Supplier of Services",
            "Recipient of Goods or Services",
            "Wholesale Business",
        ];

        return (
            <main className="gst-trn-main-shell gstin-form-shell">
                <div className="gst-trn-breadcrumb-row">
                    <span>Home</span>
                    <span className="gst-trn-breadcrumb-sep">›</span>
                    <span>{currentBreadcrumb}</span>
                    <span className="gst-trn-language">English</span>
                </div>

                <GstinFormHeader
                    activeTab={activeTab}
                    completedTabs={completedTabs}
                    applicationDate={applicationDate}
                />

                <div className="gstin-tab-content">
                    {activeTab === 1 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Details of your Business</div>
                            <p className="gstin-note">* indicates mandatory fields</p>
                            <div className="gstin-two-col">
                                <FieldBlock label="Legal Name of the Business">
                                    <GSTReadonlyField value={data.legalBusinessName} />
                                </FieldBlock>
                                <FieldBlock label="Permanent Account Number (PAN)">
                                    <GSTReadonlyField value={data.proprietorPan} />
                                </FieldBlock>
                            </div>
                            <div className="gstin-two-col">
                                <FieldBlock label="Trade Name">
                                    <GSTInput value={data.tradeName} placeholder="Enter Legal Name of Business" hasError={false} onChange={(v) => updateField("tradeName", v)} />
                                </FieldBlock>
                                <FieldBlock label="Constitution of Business (Select Appropriate) *" error={errors.constitutionOfBusiness}>
                                    <GSTSelect value={data.constitutionOfBusiness} placeholder="Select" options={GSTIN_CONSTITUTION_OPTIONS} hasError={Boolean(errors.constitutionOfBusiness)} onChange={(v) => updateField("constitutionOfBusiness", v)} />
                                </FieldBlock>
                            </div>
                            <div className="gstin-two-col">
                                <FieldBlock label="Name of the State">
                                    <GSTReadonlyField value={data.registeredState} />
                                </FieldBlock>
                                <FieldBlock label="District">
                                    <GSTReadonlyField value={data.registeredDistrict} />
                                </FieldBlock>
                            </div>
                            <div className="gstin-toggle-grid">
                                <div className="gstin-toggle-card">
                                    <p className="gstin-toggle-card-label">Are you applying for registration as a casual taxable person?</p>
                                    <button type="button" className="gstin-toggle-btn"><span className="gstin-toggle-knob" /></button>
                                </div>
                                <div className="gstin-two-col">
                                    <FieldBlock label="Period for which registration is required">
                                        <GSTStaticInput placeholder="From   --/--/----" />
                                    </FieldBlock>
                                    <FieldBlock label="Period for which registration is required">
                                        <GSTStaticInput placeholder="To   --/--/----" />
                                    </FieldBlock>
                                </div>
                            </div>
                            <div className="gstin-estimated-card">
                                <div className="gstin-estimated-title">Estimated supplies and Estimated Net Tax Liability</div>
                                <table className="gstin-hsn-table">
                                    <thead>
                                        <tr><th>Type of Tax</th><th>Turnover (Rs.)</th><th>Net Tax Liability (Rs.)</th></tr>
                                    </thead>
                                    <tbody>
                                        {["Integrated Tax", "Central Tax", "State Tax / UT Tax", "Cess"].map((tax) => (
                                            <tr key={tax}>
                                                <td>{tax}</td>
                                                <td><GSTStaticInput placeholder={`Enter ${tax}`} /></td>
                                                <td><GSTStaticInput placeholder={`Enter ${tax}`} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="gstin-inline-warning-row">
                                    <div className="gstin-inline-warning">Warning! As a casual taxable person, period of registration and net tax liability values are non-editable once challan is generated.</div>
                                    <button type="button" className="gstin-save-btn">GENERATE CHALLAN</button>
                                </div>
                            </div>
                            <div className="gstin-toggle-card">
                                <p className="gstin-toggle-card-label">Option For Composition</p>
                                <button type="button" className="gstin-toggle-btn"><span className="gstin-toggle-knob" /></button>
                            </div>
                            <div className="gstin-two-col">
                                <FieldBlock label="Reason to obtain registration *" error={errors.reasonForRegistration}>
                                    <GSTSelect value={data.reasonForRegistration} placeholder="Select" options={GSTIN_REASON_OPTIONS} hasError={Boolean(errors.reasonForRegistration)} onChange={(v) => updateField("reasonForRegistration", v)} />
                                </FieldBlock>
                                <FieldBlock label="Date of commencement of Business *" error={errors.dateOfCommencement}>
                                    <GSTInput value={data.dateOfCommencement} placeholder="DD-MM-YYYY" hasError={Boolean(errors.dateOfCommencement)} onChange={(v) => updateField("dateOfCommencement", v)} />
                                </FieldBlock>
                            </div>
                            <div className="gstin-existing-card">
                                <div className="gstin-subtle-title">Indicate Existing Registrations</div>
                                <div className="gstin-three-col">
                                    <FieldBlock label="Type of Registration"><GSTSelect value="" placeholder="Select" options={["GSTIN", "Temporary ID", "Registration under Shops and Establishment Act", "Others (Please specify)"]} hasError={false} onChange={() => {}} /></FieldBlock>
                                    <FieldBlock label="Registration No."><GSTStaticInput /></FieldBlock>
                                    <FieldBlock label="Date of Registration"><GSTStaticInput placeholder="--/--/----" /></FieldBlock>
                                </div>
                                <div className="gstin-mini-actions">
                                    <button type="button" className="gstin-save-btn">+ ADD</button>
                                    <button type="button" className="gst-trn-secondary-button">CANCEL</button>
                                </div>
                            </div>
                            <div className="gstin-jurisdiction-row">
                                <FieldBlock label="Ward/Circle/Charge/Unit *" error={errors.ward}>
                                    <GSTInput value={data.ward} placeholder="Enter ward" hasError={Boolean(errors.ward)} onChange={(v) => updateField("ward", v)} />
                                </FieldBlock>
                                <FieldBlock label="Commissionerate *" error={errors.commissionerate}>
                                    <GSTInput value={data.commissionerate} placeholder="Enter commissionerate" hasError={Boolean(errors.commissionerate)} onChange={(v) => updateField("commissionerate", v)} />
                                </FieldBlock>
                                <FieldBlock label="Division *" error={errors.division}>
                                    <GSTInput value={data.division} placeholder="Enter division" hasError={Boolean(errors.division)} onChange={(v) => updateField("division", v)} />
                                </FieldBlock>
                                <FieldBlock label="Range *" error={errors.range}>
                                    <GSTInput value={data.range} placeholder="Enter range" hasError={Boolean(errors.range)} onChange={(v) => updateField("range", v)} />
                                </FieldBlock>
                            </div>
                            <GstinTabActions isFirst onSave={() => handleTabSave(1)} />
                        </div>
                    )}

                    {activeTab === 2 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Details of Proprietor</div>
                            <p className="gstin-note">* indicates mandatory fields</p>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">👤</span>Personal Information</div>
                            <div className="gstin-three-col">
                                <FieldBlock label="First Name *" error={errors.proprietorFirstName}><GSTInput value={data.proprietorFirstName} placeholder="First Name" hasError={Boolean(errors.proprietorFirstName)} onChange={(v) => updateField("proprietorFirstName", v)} /></FieldBlock>
                                <FieldBlock label="Middle Name"><GSTStaticInput placeholder="Middle Name" /></FieldBlock>
                                <FieldBlock label="Last Name"><GSTStaticInput placeholder="Last Name" /></FieldBlock>
                            </div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Father's First Name *" error={errors.proprietorFatherFirstName}><GSTInput value={data.proprietorFatherFirstName} placeholder="First Name" hasError={Boolean(errors.proprietorFatherFirstName)} onChange={(v) => updateField("proprietorFatherFirstName", v)} /></FieldBlock>
                                <FieldBlock label="Middle Name"><GSTStaticInput placeholder="Middle Name" /></FieldBlock>
                                <FieldBlock label="Last Name"><GSTStaticInput placeholder="Last Name" /></FieldBlock>
                            </div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Date of Birth *" error={errors.proprietorDob}><GSTInput value={data.proprietorDob} placeholder="--/--/----" hasError={Boolean(errors.proprietorDob)} onChange={(v) => updateField("proprietorDob", v)} /></FieldBlock>
                                <FieldBlock label="Mobile Number *" error={errors.proprietorMobile}><GSTInput value={data.proprietorMobile} placeholder="Enter mobile" hasError={Boolean(errors.proprietorMobile)} prefix="+91" onChange={(v) => updateField("proprietorMobile", v.replace(/\D/g, "").slice(0, 10))} /></FieldBlock>
                                <FieldBlock label="Email Address *" error={errors.proprietorEmail}><GSTInput value={data.proprietorEmail} placeholder="Email Address" hasError={Boolean(errors.proprietorEmail)} icon={<Mail size={14} strokeWidth={2.4} />} onChange={(v) => updateField("proprietorEmail", v)} /></FieldBlock>
                            </div>
                            <div className="gstin-two-col">
                                <div>
                                    <p className="gstin-gender-label">Gender *</p>
                                    <div className="gstin-gender-row">
                                        {["Male", "Female", "Others"].map((g) => (
                                            <label key={g} className="gst-trn-radio" onClick={() => updateField("gender", g)}>
                                                <span className={`gst-trn-radio-mark${data.gender === g ? " is-checked" : ""}`} aria-hidden="true" />
                                                <span>{g}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <FieldBlock label="Telephone Number (with STD Code)"><GSTStaticInput placeholder="STD   Enter Telephone Number" /></FieldBlock>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">🪪</span>Identity Information</div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Designation / Status *" error={errors.proprietorDesignation}><GSTSelect value={data.proprietorDesignation} placeholder="Enter Designation" options={GSTIN_DESIGNATION_OPTIONS} hasError={Boolean(errors.proprietorDesignation)} onChange={(v) => updateField("proprietorDesignation", v)} /></FieldBlock>
                                <FieldBlock label="Director Identification Number"><GSTStaticInput placeholder="Enter DIN Number" /></FieldBlock>
                                <div className="gstin-toggle-card gstin-compact-card"><p className="gstin-toggle-card-label">Are you citizen of india?</p><button type="button" className="gstin-toggle-btn is-on"><span className="gstin-toggle-knob" /></button></div>
                            </div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Permanent Account Number (PAN) *"><GSTReadonlyField value={data.proprietorPan} /></FieldBlock>
                                <FieldBlock label="Passport Number (In case of Foreigner)"><GSTStaticInput placeholder="Enter Passport Number" /></FieldBlock>
                                <FieldBlock label="Aadhaar Number"><GSTReadonlyField value={data.proprietorAadhaar} /></FieldBlock>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">✉</span>Residential Address</div>
                            <div className="gstin-address-grid">
                                <FieldBlock label="Building No. / Flat No. *" error={errors.residentialFlatNo}><GSTInput value={data.residentialFlatNo} placeholder="Enter Building No. / Flat No. / Door No." hasError={Boolean(errors.residentialFlatNo)} onChange={(v) => updateField("residentialFlatNo", v)} /></FieldBlock>
                                <FieldBlock label="Floor Number" error={errors.residentialFloor}><GSTInput value={data.residentialFloor} placeholder="Enter Floor Number" hasError={Boolean(errors.residentialFloor)} onChange={(v) => updateField("residentialFloor", v)} /></FieldBlock>
                                <FieldBlock label="Name of the Premises / Building" error={errors.residentialBuilding}><GSTInput value={data.residentialBuilding} placeholder="Enter Premises / Building" hasError={Boolean(errors.residentialBuilding)} onChange={(v) => updateField("residentialBuilding", v)} /></FieldBlock>
                                <FieldBlock label="Road / Street. *" error={errors.residentialStreet}><GSTInput value={data.residentialStreet} placeholder="Enter Road / Street / Lane" hasError={Boolean(errors.residentialStreet)} onChange={(v) => updateField("residentialStreet", v)} /></FieldBlock>
                                <FieldBlock label="City / Town / Locality / Village *" error={errors.residentialCity}><GSTInput value={data.residentialCity} placeholder="Enter Locality / Area / Village" hasError={Boolean(errors.residentialCity)} onChange={(v) => updateField("residentialCity", v)} /></FieldBlock>
                                <FieldBlock label="Country *"><GSTSelect value={data.residentialCountry} placeholder="Select" options={["India"]} hasError={false} onChange={(v) => updateField("residentialCountry", v)} /></FieldBlock>
                                <FieldBlock label="State *" error={errors.residentialState}><GSTSelect value={data.residentialState} placeholder="Enter State Name" options={TRN_STATE_OPTIONS} hasError={Boolean(errors.residentialState)} onChange={(v) => { updateField("residentialState", v); updateField("residentialDistrict", ""); }} /></FieldBlock>
                                <FieldBlock label="District *" error={errors.residentialDistrict}><GSTSelect value={data.residentialDistrict} placeholder="Enter District Name" options={residentialDistrictOptions} hasError={Boolean(errors.residentialDistrict)} onChange={(v) => updateField("residentialDistrict", v)} /></FieldBlock>
                                <FieldBlock label="Pin Code *" error={errors.residentialPin}><GSTInput value={data.residentialPin} placeholder="Enter Pin Code" hasError={Boolean(errors.residentialPin)} onChange={(v) => updateField("residentialPin", v.replace(/\D/g, "").slice(0, 6))} /></FieldBlock>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">☁</span>Document Upload</div>
                            <div className="gstin-upload-panel">
                                <div className="gstin-upload-column">
                                    <p>Upload Photograph (of person whose information has been given above) *</p>
                                    <p className="gstin-upload-note">Only JPEG file format is allowed</p>
                                    <p className="gstin-upload-note">Maximum file size for upload 100 KB</p>
                                    <div className="gstin-file-row"><button type="button" className="gst-trn-secondary-button">Choose File</button><span>No file chosen</span></div>
                                </div>
                                <div className="gstin-upload-divider">OR</div>
                                <div className="gstin-upload-column gstin-upload-camera">
                                    <button type="button" className="gstin-save-btn">TAKE PICTURE</button>
                                    <p className="gstin-upload-note">You can use your device camera to take selfie Photograph</p>
                                </div>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">i</span>Other Information</div>
                            <div className="gstin-toggle-card"><p className="gstin-toggle-card-label">Also Authorized Signatory</p><button type="button" className="gstin-toggle-btn"><span className="gstin-toggle-knob" /></button></div>
                            <div className="gstin-bottom-toolbar">
                                <button type="button" className="gst-trn-secondary-button" onClick={() => setActiveTab(1)}>BACK</button>
                                <button type="button" className="gst-trn-secondary-button">SHOW LIST</button>
                                <button type="button" className="gstin-save-btn">ADD NEW</button>
                                <button type="button" className="gstin-save-btn" onClick={() => handleTabSave(2)}>SAVE &amp; CONTINUE</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 3 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Details of Authorized Signatory</div>
                            <p className="gstin-note">* indicates mandatory fields</p>
                            <div className="gstin-checkbox-strip">
                                <label className="gstin-checkbox-label"><input type="checkbox" className="gstin-checkbox" /><span>Primary Authorized Signatory</span></label>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">👤</span>Personal Information</div>
                            <div className="gstin-three-col">
                                <FieldBlock label="First Name *"><GSTStaticInput placeholder="First Name" /></FieldBlock>
                                <FieldBlock label="Middle Name"><GSTStaticInput placeholder="Middle Name" /></FieldBlock>
                                <FieldBlock label="Last Name"><GSTStaticInput placeholder="Last Name" /></FieldBlock>
                            </div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Father's First Name *"><GSTStaticInput placeholder="First Name" /></FieldBlock>
                                <FieldBlock label="Middle Name"><GSTStaticInput placeholder="Middle Name" /></FieldBlock>
                                <FieldBlock label="Last Name"><GSTStaticInput placeholder="Last Name" /></FieldBlock>
                            </div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Date of Birth *"><GSTStaticInput placeholder="--/--/----" /></FieldBlock>
                                <FieldBlock label="Mobile Number *"><GSTStaticInput placeholder="+91" /></FieldBlock>
                                <FieldBlock label="Email Address *"><GSTStaticInput placeholder="Email Address" /></FieldBlock>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">🪪</span>Identity Information</div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Designation / Status *"><GSTStaticInput placeholder="Enter Designation" /></FieldBlock>
                                <FieldBlock label="Director Identification Number"><GSTStaticInput placeholder="Enter DIN Number" /></FieldBlock>
                                <div className="gstin-toggle-card gstin-compact-card"><p className="gstin-toggle-card-label">Are you citizen of india?</p><button type="button" className="gstin-toggle-btn is-on"><span className="gstin-toggle-knob" /></button></div>
                            </div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Permanent Account Number (PAN) *"><GSTReadonlyField value={data.proprietorPan} /></FieldBlock>
                                <FieldBlock label="Passport Number (In case of Foreigner)"><GSTStaticInput placeholder="Enter Passport Number" /></FieldBlock>
                                <FieldBlock label="Aadhaar Number"><GSTReadonlyField value={data.proprietorAadhaar} /></FieldBlock>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">✉</span>Residential Address</div>
                            <div className="gstin-validation-note">i. Please be aware that the GST system incorporates mandatory address validations for accuracy and uniformity.</div>
                            <div className="gstin-map-placeholder" aria-hidden="true"><div className="gstin-map-inner"><svg viewBox="0 0 320 180" className="gstin-map-svg"><rect width="320" height="180" fill="#dce8f0" /><ellipse cx="160" cy="90" rx="110" ry="70" fill="#c5d8e8" /><ellipse cx="160" cy="90" rx="70" ry="45" fill="#b0ccde" /><circle cx="160" cy="90" r="5" fill="#e04a4a" /><circle cx="160" cy="90" r="10" fill="none" stroke="#e04a4a" strokeWidth="2" /></svg></div></div>
                            <div className="gstin-address-grid">
                                <FieldBlock label="Country *"><GSTSelect value={data.residentialCountry} placeholder="Select" options={["India"]} hasError={false} onChange={() => {}} /></FieldBlock>
                                <FieldBlock label="Pin Code *"><GSTInput value={data.residentialPin} placeholder="Enter Pin Code" hasError={false} onChange={(v) => updateField("residentialPin", v.replace(/\D/g, "").slice(0, 6))} /></FieldBlock>
                                <FieldBlock label="State *"><GSTSelect value={data.residentialState} placeholder="Enter State Name" options={TRN_STATE_OPTIONS} hasError={false} onChange={(v) => updateField("residentialState", v)} /></FieldBlock>
                                <FieldBlock label="District *"><GSTSelect value={data.residentialDistrict} placeholder="Enter District Name" options={residentialDistrictOptions} hasError={false} onChange={(v) => updateField("residentialDistrict", v)} /></FieldBlock>
                                <FieldBlock label="City / Town / Village *"><GSTInput value={data.residentialCity} placeholder="Enter City / Town / Village" hasError={false} onChange={(v) => updateField("residentialCity", v)} /></FieldBlock>
                                <FieldBlock label="Locality / Sub Locality"><GSTStaticInput placeholder="Enter Locality / Sub Locality" /></FieldBlock>
                                <FieldBlock label="Road / Street *"><GSTInput value={data.residentialStreet} placeholder="Enter Road / Street / Lane" hasError={false} onChange={(v) => updateField("residentialStreet", v)} /></FieldBlock>
                                <FieldBlock label="Name of the Premises / Building"><GSTInput value={data.residentialBuilding} placeholder="Enter Premises / Building" hasError={false} onChange={(v) => updateField("residentialBuilding", v)} /></FieldBlock>
                                <FieldBlock label="Building No. / Flat No. *"><GSTInput value={data.residentialFlatNo} placeholder="Enter Building No. / Flat No. / Door No." hasError={false} onChange={(v) => updateField("residentialFlatNo", v)} /></FieldBlock>
                                <FieldBlock label="Floor Number"><GSTInput value={data.residentialFloor} placeholder="Enter Floor Number" hasError={false} onChange={(v) => updateField("residentialFloor", v)} /></FieldBlock>
                                <FieldBlock label="Nearby Landmark"><GSTStaticInput placeholder="Nearby Landmark" /></FieldBlock>
                            </div>
                            <div className="gstin-reset-row"><button type="button" className="gstin-save-btn">RESET ADDRESS</button></div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">☁</span>Document Upload</div>
                            <div className="gstin-two-col">
                                <FieldBlock label="Proof of details of authorized signatory *"><GSTSelect value="" placeholder="Select" options={GSTIN_DOCUMENT_TYPE_OPTIONS} hasError={false} onChange={() => {}} /></FieldBlock>
                                <FieldBlock label="Upload Photograph (of person whose information has been given above) *"><div className="gstin-file-row"><button type="button" className="gst-trn-secondary-button">Choose File</button><span>No file chosen</span></div></FieldBlock>
                            </div>
                            <div className="gstin-bottom-toolbar">
                                <button type="button" className="gst-trn-secondary-button" onClick={() => setActiveTab(2)}>BACK</button>
                                <button type="button" className="gst-trn-secondary-button">SHOW LIST</button>
                                <button type="button" className="gstin-save-btn">ADD NEW</button>
                                <button type="button" className="gstin-save-btn" onClick={() => completeTab(3)}>SAVE &amp; CONTINUE</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 4 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Details of Authorized Representative</div>
                            <p className="gstin-note">* indicates mandatory fields</p>
                            <div className="gstin-simple-toggle-row">
                                <label className="gstin-checkbox-label"><input type="checkbox" className="gstin-checkbox" /><span>Do you have any Authorized Representative?</span></label>
                                <div className="gstin-toggle-off" />
                            </div>
                            <GstinTabActions onBack={() => setActiveTab(3)} onSave={() => completeTab(4)} />
                        </div>
                    )}

                    {activeTab === 5 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Details of Principal Place of Business</div>
                            <p className="gstin-note">* indicates mandatory fields</p>
                            <div className="gstin-validation-note">i. Please be aware that the GST system incorporates mandatory address validations for accuracy and uniformity.</div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">✉</span>Address</div>
                            <div className="gstin-map-placeholder" aria-hidden="true"><div className="gstin-map-inner"><svg viewBox="0 0 320 180" className="gstin-map-svg"><rect width="320" height="180" fill="#dce8f0" /><ellipse cx="160" cy="90" rx="110" ry="70" fill="#c5d8e8" /><ellipse cx="160" cy="90" rx="70" ry="45" fill="#b0ccde" /><circle cx="160" cy="90" r="5" fill="#e04a4a" /><circle cx="160" cy="90" r="10" fill="none" stroke="#e04a4a" strokeWidth="2" /></svg></div></div>
                            <div className="gstin-address-grid">
                                <FieldBlock label="Pin Code *" error={errors.businessPin}><GSTInput value={data.businessPin} placeholder="Enter Pin Code" hasError={Boolean(errors.businessPin)} onChange={(v) => updateField("businessPin", v.replace(/\D/g, "").slice(0, 6))} /></FieldBlock>
                                <FieldBlock label="State *" error={errors.businessState}><GSTSelect value={data.businessState} placeholder="Enter State Name" options={TRN_STATE_OPTIONS} hasError={Boolean(errors.businessState)} onChange={(v) => { updateField("businessState", v); updateField("businessDistrict", ""); }} /></FieldBlock>
                                <FieldBlock label="District" error={errors.businessDistrict}><GSTSelect value={data.businessDistrict} placeholder="Enter District Name" options={businessDistrictOptions} hasError={Boolean(errors.businessDistrict)} onChange={(v) => updateField("businessDistrict", v)} /></FieldBlock>
                                <FieldBlock label="City / Town / Village *" error={errors.businessCity}><GSTInput value={data.businessCity} placeholder="Enter City / Town / Village" hasError={Boolean(errors.businessCity)} onChange={(v) => updateField("businessCity", v)} /></FieldBlock>
                                <FieldBlock label="Locality/Sub Locality"><GSTStaticInput placeholder="Enter Locality/Sub Locality" /></FieldBlock>
                                <FieldBlock label="Road / Street. *" error={errors.businessStreet}><GSTInput value={data.businessStreet} placeholder="Enter Road / Street / Lane" hasError={Boolean(errors.businessStreet)} onChange={(v) => updateField("businessStreet", v)} /></FieldBlock>
                                <FieldBlock label="Name of Premises / Building *" error={errors.businessBuilding}><GSTInput value={data.businessBuilding} placeholder="Enter Premises / Building" hasError={Boolean(errors.businessBuilding)} onChange={(v) => updateField("businessBuilding", v)} /></FieldBlock>
                                <FieldBlock label="Building No. / Flat No. *" error={errors.businessFlatNo}><GSTInput value={data.businessFlatNo} placeholder="Enter Building No. / Flat No. / Door No." hasError={Boolean(errors.businessFlatNo)} onChange={(v) => updateField("businessFlatNo", v)} /></FieldBlock>
                                <FieldBlock label="Floor Number" error={errors.businessFloor}><GSTInput value={data.businessFloor} placeholder="Enter Floor Number" hasError={Boolean(errors.businessFloor)} onChange={(v) => updateField("businessFloor", v)} /></FieldBlock>
                                <FieldBlock label="Nearby Landmark"><GSTStaticInput placeholder="Enter Nearby Landmark" /></FieldBlock>
                                <FieldBlock label="Latitude"><GSTStaticInput placeholder="Enter Latitude" /></FieldBlock>
                                <FieldBlock label="Longitude"><GSTStaticInput placeholder="Enter Longitude" /></FieldBlock>
                            </div>
                            <div className="gstin-reset-row"><button type="button" className="gstin-save-btn">RESET ADDRESS</button></div>
                            <div className="gstin-two-col">
                                <FieldBlock label="State Jurisdiction"><GSTStaticInput placeholder="Circle" /></FieldBlock>
                                <FieldBlock label="Sector / Circle / Ward / Charge / Unit *" error={errors.ward}><GSTInput value={data.ward} placeholder="Sector / Circle / Ward / Charge / Unit" hasError={Boolean(errors.ward)} onChange={(v) => updateField("ward", v)} /></FieldBlock>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">◧</span>Center Jurisdiction</div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Commissionerate *" error={errors.commissionerate}><GSTInput value={data.commissionerate} placeholder="Commissionerate" hasError={Boolean(errors.commissionerate)} onChange={(v) => updateField("commissionerate", v)} /></FieldBlock>
                                <FieldBlock label="Division *" error={errors.division}><GSTInput value={data.division} placeholder="Division" hasError={Boolean(errors.division)} onChange={(v) => updateField("division", v)} /></FieldBlock>
                                <FieldBlock label="Range *" error={errors.range}><GSTInput value={data.range} placeholder="Range" hasError={Boolean(errors.range)} onChange={(v) => updateField("range", v)} /></FieldBlock>
                            </div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">📞</span>Contact Information</div>
                            <div className="gstin-three-col">
                                <FieldBlock label="Office Email Address *" error={errors.businessEmail}><GSTInput value={data.businessEmail} placeholder="Office Email Address" hasError={Boolean(errors.businessEmail)} icon={<Mail size={14} strokeWidth={2.4} />} onChange={(v) => updateField("businessEmail", v)} /></FieldBlock>
                                <FieldBlock label="Office Telephone Number (with STD Code)"><GSTStaticInput placeholder="STD   Enter Telephone Number" /></FieldBlock>
                                <FieldBlock label="Mobile Number *"><GSTStaticInput placeholder="+91" /></FieldBlock>
                                <FieldBlock label="Office Fax Number (with STD Code)"><GSTStaticInput placeholder="STD   Enter Telephone Number" /></FieldBlock>
                            </div>
                            <div className="gstin-two-col">
                                <FieldBlock label="Nature of possession of premises *"><GSTSelect value={data.natureOfPossession} placeholder="Select" options={GSTIN_NATURE_OF_POSSESSION_OPTIONS} hasError={false} onChange={(v) => updateField("natureOfPossession", v)} /></FieldBlock>
                                <FieldBlock label="Document Upload *"><GSTSelect value="" placeholder="Select" options={GSTIN_DOCUMENT_TYPE_OPTIONS} hasError={false} onChange={() => {}} /></FieldBlock>
                            </div>
                            <div className="gstin-file-row"><button type="button" className="gst-trn-secondary-button">Choose File</button><span>No file chosen</span></div>
                            <div className="gstin-sub-section-header"><span className="gstin-sub-section-icon">🏭</span>Nature of Business Activity being carried out at above mentioned premises</div>
                            <div className="gstin-business-nature-grid">
                                {businessActivities.map((opt) => (
                                    <label key={opt} className="gstin-checkbox-label">
                                        <input type="checkbox" className="gstin-checkbox" checked={data.businessNature.includes(opt)} onChange={(e) => {
                                            const next = e.target.checked ? [...data.businessNature, opt] : data.businessNature.filter((n) => n !== opt);
                                            updateField("businessNature", next);
                                        }} />
                                        <span>{opt}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="gstin-toggle-card"><p className="gstin-toggle-card-label">Have Additional Place of Business</p><button type="button" className="gstin-toggle-btn"><span className="gstin-toggle-knob" /></button></div>
                            <GstinTabActions onBack={() => setActiveTab(4)} onSave={() => handleTabSave(5)} />
                        </div>
                    )}

                    {activeTab === 6 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Details of Additional Places of your Business</div>
                            <div className="gstin-additional-info">
                                <p><strong>Important!</strong> If you need to add details on additional places of business:</p>
                                <p>1. Go to Principal Place of Business tab.</p>
                                <p>2. Select Yes for Have Additional Places of Business.</p>
                            </div>
                            <div className="gstin-bottom-toolbar">
                                <button type="button" className="gst-trn-secondary-button" onClick={() => setActiveTab(5)}>BACK</button>
                                <button type="button" className="gst-trn-secondary-button">SHOW LIST</button>
                                <button type="button" className="gstin-save-btn">ADD NEW</button>
                                <button type="button" className="gstin-save-btn" onClick={() => completeTab(6)}>SAVE &amp; CONTINUE</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 7 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Details of Goods / Commodities supplied by the business</div>
                            <div className="gstin-goods-tabs">
                                <button type="button" className={`gstin-goods-tab${goodsMode === "goods" ? " is-active" : ""}`} onClick={() => setGoodsMode("goods")}>Goods</button>
                                <button type="button" className={`gstin-goods-tab${goodsMode === "services" ? " is-active" : ""}`} onClick={() => setGoodsMode("services")}>Services</button>
                            </div>
                            <p className="gstin-note">Please specify top 5 Commodities</p>
                            <div className="gstin-hsn-search-row">
                                <div className="gstin-hsn-search-wrap">
                                    <select className="gstin-hsn-search-input" value={data.hsn} onChange={(e) => updateField("hsn", e.target.value)}>
                                        <option value="">Select</option>
                                        <option value="6901">6901</option>
                                        <option value="6912">6912</option>
                                        <option value="4819">4819</option>
                                        <option value="4420">4420</option>
                                        <option value="3923">3923</option>
                                    </select>
                                </div>
                                <GSTFieldError message={errors.hsn} />
                            </div>
                            {data.hsn.trim() ? (
                                <div className="gstin-hsn-list">
                                    <p className="gstin-hsn-list-title">List of Goods</p>
                                    <table className="gstin-hsn-table">
                                        <thead>
                                            <tr><th>Sl No</th><th>HSN Code</th><th>Description of Goods</th><th>Action</th></tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>1</td>
                                                <td>{data.hsn}</td>
                                                <td>BRICKS, BLOCKS, TILES AND OTHER CERAMIC GOODS OF SILICEOUS FOSSIL MEALS OR OF SIMILAR SILICEOUS EARTHS</td>
                                                <td><button type="button" className="gstin-hsn-remove" onClick={() => updateField("hsn", "")}>DELETE</button></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                            <GstinTabActions onBack={() => setActiveTab(6)} onSave={() => handleTabSave(7)} />
                        </div>
                    )}

                    {activeTab === 8 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">State Specific Information</div>
                            <p className="gstin-note">* indicates mandatory fields</p>
                            <div className="gstin-two-col">
                                <FieldBlock label="Professional Tax Employee Code (EC) No."><GSTStaticInput placeholder="Enter EC No." /></FieldBlock>
                                <FieldBlock label="Professional Tax Registration Certificate (RC) No."><GSTStaticInput placeholder="Enter RC No." /></FieldBlock>
                            </div>
                            <FieldBlock label="State Excise Licence No."><GSTStaticInput placeholder="Enter licence no." /></FieldBlock>
                            <GstinTabActions onBack={() => setActiveTab(7)} onSave={() => completeTab(8)} />
                        </div>
                    )}

                    {activeTab === 9 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Aadhaar Authentication</div>
                            <p className="gstin-note">* indicates mandatory fields</p>
                            <div className="gstin-aadhaar-auth-row">
                                <p className="gstin-aadhaar-auth-label">If you want to opt for Aadhaar Authentication of details of Promoter/Partner/Primary Authorized Signatory added by you?</p>
                                <button type="button" className={`gstin-toggle-btn${data.aadhaarAuthEnabled ? " is-on" : ""}`} onClick={() => updateField("aadhaarAuthEnabled", !data.aadhaarAuthEnabled)}><span className="gstin-toggle-knob" /></button>
                            </div>
                            {data.aadhaarAuthEnabled ? (
                                <div className="gstin-aadhaar-auth-table">
                                    <table className="gstin-saved-apps-table">
                                        <thead><tr><th>Serial No</th><th>Name</th><th>Citizen/Resident of India</th><th>Promoter/Primary Authorized Signatory</th><th>Designation</th><th>Email Address</th><th>Mobile No</th><th>Status</th></tr></thead>
                                        <tbody>
                                            <tr>
                                                <td>1</td>
                                                <td>{data.proprietorFirstName || "—"}</td>
                                                <td>Yes</td>
                                                <td>Promoter</td>
                                                <td>{data.proprietorDesignation || "Proprietor"}</td>
                                                <td>{data.proprietorEmail || "—"}</td>
                                                <td>{data.proprietorMobile || "—"}</td>
                                                <td><span className="gstin-draft-badge">Pending</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            ) : null}
                            <GstinTabActions onBack={() => setActiveTab(8)} onSave={() => completeTab(9)} />
                        </div>
                    )}

                    {activeTab === 10 && (
                        <div className="gstin-tab-panel">
                            <div className="gstin-section-header">Verification</div>
                            <div className="gstin-verification-declaration">
                                <label className="gstin-checkbox-label">
                                    <input type="checkbox" className="gstin-checkbox" />
                                    <span>I hereby solemnly affirm and declare that the information given herein above is true and correct to the best of my knowledge and belief and nothing has been concealed therefrom.</span>
                                </label>
                            </div>
                            <div className="gstin-two-col" style={{ marginTop: "20px" }}>
                                <FieldBlock label="Name of Authorized Signatory *" error={errors.verificationName}>
                                    <GSTSelect value={data.verificationName} placeholder="Select" options={data.proprietorFirstName ? [data.proprietorFirstName] : []} hasError={Boolean(errors.verificationName)} onChange={(v) => updateField("verificationName", v)} />
                                </FieldBlock>
                                <FieldBlock label="Place *" error={errors.verificationPlace}>
                                    <GSTInput value={data.verificationPlace} placeholder="Enter Place" hasError={Boolean(errors.verificationPlace)} onChange={(v) => updateField("verificationPlace", v)} />
                                </FieldBlock>
                            </div>
                            <div className="gstin-two-col">
                                <FieldBlock label="Designation / Status *"><GSTReadonlyField value={data.proprietorDesignation || "Proprietor"} /></FieldBlock>
                                <FieldBlock label="Date"><GSTReadonlyField value={applicationDate} /></FieldBlock>
                            </div>
                            <div className="gstin-verification-note">
                                <label className="gstin-checkbox-label"><input type="checkbox" className="gstin-checkbox" /><span>DSC is compulsory for Companies &amp; LLP</span></label>
                            </div>
                            <p className="gstin-help-link">Facing Problem using DSC? click here for help</p>
                            <div className="gstin-validation-note">Submit buttons will get enabled only after all mandatory fields are filled. Please check that you have filled all mandatory fields in the Form.</div>
                            {saveError ? <div className="gst-trn-save-error">{saveError}</div> : null}
                            <div className="gstin-bottom-toolbar">
                                <button type="button" className="gst-trn-secondary-button" onClick={() => setActiveTab(9)}>BACK</button>
                                <button type="button" className="gstin-save-btn" onClick={() => handleTabSave(10)}>SUBMIT WITH DSC</button>
                                <button type="button" className="gstin-save-btn">SUBMIT WITH EVC</button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Step 1: TRN entry  |  Step 2: OTP
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <main className="gst-trn-main-shell">
            <div className="gst-trn-breadcrumb-row">
                <span>Home</span>
                <span className="gst-trn-breadcrumb-sep">›</span>
                <span>Registration</span>
                <span className="gst-trn-language">English</span>
            </div>

            <section className="gst-trn-card">
                {/* Stepper */}
                <div className="gst-trn-stepper">
                    <div className={`gst-trn-step-item${stage === "trn" ? " is-active" : " is-complete"}`}>
                        <div className="gst-trn-step-number">{stage !== "trn" ? "✓" : "1"}</div>
                        <div className="gst-trn-step-label">User Credentials</div>
                    </div>
                    <div className={`gst-trn-step-item${stage === "otp" ? " is-active" : ""}`}>
                        <div className="gst-trn-step-number">2</div>
                        <div className="gst-trn-step-label">OTP Verification</div>
                    </div>
                </div>

                {stage === "trn" ? (
                    <div className="gst-trn-stage">
                        <div className="gst-trn-stage-header">
                            <h2>New Registration</h2>
                            <p><span>*</span> indicates mandatory fields</p>
                        </div>

                        {/* Radio — TRN option selected */}
                        <div className="gst-trn-radio-row">
                            <GSTRadio checked={false} label="New Registration" />
                            <GSTRadio checked={true}  label="Temporary Reference Number (TRN)" />
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Temporary Reference Number (TRN) <span>*</span></label>
                            <GSTInput
                                value={data.trn}
                                placeholder="Enter TRN"
                                hasError={Boolean(errors.trn)}
                                autoComplete="off"
                                onChange={(v) => updateField("trn", v)}
                            />
                            <GSTFieldError message={errors.trn} />
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Type the characters you see in the image below <span>*</span></label>
                            <GSTInput
                                value={data.captcha}
                                placeholder="Enter characters as displayed in the CAPTCHA image"
                                hasError={Boolean(errors.captcha)}
                                maxLength={6}
                                autoComplete="off"
                                onChange={(v) => updateField("captcha", v.toUpperCase().slice(0, 6))}
                            />
                            <GSTFieldError message={errors.captcha} />
                            <TrnCaptcha className="gst-trn-captcha-box" code={captchaCode} />
                        </div>

                        <div className="gst-trn-actions">
                            <button type="button" className="gst-trn-primary-button" onClick={handleProceedTrn}>
                                PROCEED
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="gst-trn-stage gst-trn-stage-otp">
                        <div className="gst-trn-stage-header">
                            <h2>Verify OTP</h2>
                            <p><span>*</span> indicates mandatory fields</p>
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Mobile / Email OTP ({expectedOtp}) <span>*</span></label>
                            <GSTInput
                                value={data.otp}
                                placeholder=""
                                hasError={Boolean(errors.otp)}
                                type="password"
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="off"
                                onChange={(v) => updateField("otp", v.replace(/\D/g, "").slice(0, 6))}
                            />
                            <GSTFieldError message={errors.otp} />
                            <p className="gst-trn-helper-note">
                                OTP has been sent to your registered Mobile Number and Email Address.
                            </p>
                            <p className="gst-trn-helper-note">
                                Please check junk/spam folder in case you do not get email.
                            </p>
                            <button type="button" className="gst-trn-link-button">
                                Need OTP to be resent? Click here
                            </button>
                        </div>

                        <div className="gst-trn-actions gst-trn-actions-otp">
                            <button type="button" className="gst-trn-secondary-button" onClick={() => setStage("trn")}>
                                BACK
                            </button>
                            <button type="button" className="gst-trn-primary-button gst-trn-primary-button-small" onClick={handleProceedOtp}>
                                PROCEED
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

// ─── Exported client component ────────────────────────────────────────────────

export function GSTGstinRegistrationClient({
    questionId,
    initialMode,
}: GSTGstinRegistrationClientProps) {
    const [questionTitle, setQuestionTitle] = useState<string | null>(null);
    const registerHref = questionId
        ? `/gst-simulation?questionId=${questionId}&mode=register`
        : "/gst-simulation";
    const questionBadge = buildQuestionBadge(questionTitle, questionId);

    return (
        <GSTPortalChrome questionBadge={questionBadge} registerHref={registerHref}>
            {questionId && initialMode === "register" ? (
                <GSTGstinSimulator
                    questionId={questionId}
                    onQuestionTitleChange={setQuestionTitle}
                />
            ) : (
                <GSTGstinLanding registerHref={registerHref} />
            )}
        </GSTPortalChrome>
    );
}
