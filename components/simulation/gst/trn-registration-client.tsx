"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronUp, Lock, Mail } from "lucide-react";
import {
    useEffect,
    useMemo,
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
    EMPTY_TRN_REGISTRATION_DATA,
    TRN_REGISTRATION_TYPE_OPTIONS,
    TRN_STATE_OPTIONS,
    TRN_TAXPAYER_OPTIONS,
    getDistrictOptions,
    type TrnRegistrationData,
} from "@/lib/simulation/gst/trn-registration";

const GST_SERVICE_CARDS = [
    "Registration Services",
    "Return Dashboard",
    "Compliance Tools",
    "Filing Support",
] as const;

const GST_FOOTER_COLUMNS = [
    {
        title: "About GST",
        items: ["GST Council Structure", "GST History"],
    },
    {
        title: "Website Policies",
        items: [
            "Website Policy",
            "Terms and Conditions",
            "Hyperlink Policy",
            "Disclaimer",
        ],
    },
    {
        title: "Related Sites",
        items: [
            "Central Board of Indirect Taxes and Customs",
            "State Tax Websites",
            "National Portal",
        ],
    },
    {
        title: "Help and Taxpayer Facilities",
        items: [
            "System Requirements",
            "GST Knowledge Portal",
            "GST Media",
            "Site Map",
            "Grievance Nodal Officers",
            "Free Accounting and Billing Services",
            "GST Suvidha Providers",
        ],
    },
] as const;

const GST_TRN_MAPPING_CACHE_PREFIX = "gst-trn-simulation-mappings:";
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[0-9]{10}$/;

interface GSTTrnRegistrationClientProps {
    questionId: string | null;
    initialMode: string | null;
}

interface ValidationErrors {
    taxpayerType?: string;
    state?: string;
    district?: string;
    legalBusinessName?: string;
    pan?: string;
    email?: string;
    mobile?: string;
    captcha?: string;
    mobileOtp?: string;
    emailOtp?: string;
}

function getCachedMappings(questionId: string | null) {
    if (typeof window === "undefined" || !questionId) {
        return [];
    }

    try {
        const raw = window.localStorage.getItem(
            `${GST_TRN_MAPPING_CACHE_PREFIX}${questionId}`,
        );
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw) as PersistableEvaluationMapping[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function buildQuestionBadge(title: string | null, questionId: string | null) {
    if (title?.trim()) {
        return title.trim();
    }

    if (questionId) {
        return questionId.slice(0, 8).toUpperCase();
    }

    return "GST_TRN";
}

function validateStepOne(
    data: TrnRegistrationData,
    mappings: PersistableEvaluationMapping[],
): ValidationErrors {
    const nextErrors: ValidationErrors = {};
    const captchaExpected =
        mappings.find((mapping) => mapping.fieldPath === "captcha")?.expectedValue ?? "";

    if (!data.taxpayerType) {
        nextErrors.taxpayerType = "User profile is required";
    }

    if (!data.state) {
        nextErrors.state = "State / UT is required";
    }

    if (!data.district) {
        nextErrors.district = "District is required";
    }

    if (!data.legalBusinessName.trim()) {
        nextErrors.legalBusinessName = "Legal name of the business is required";
    }

    if (!PAN_REGEX.test(data.pan.trim().toUpperCase())) {
        nextErrors.pan = "Permanent Account Number (PAN) is required";
    }

    if (!EMAIL_REGEX.test(data.email.trim())) {
        nextErrors.email = "Enter a valid email address";
    }

    if (!MOBILE_REGEX.test(data.mobile.trim())) {
        nextErrors.mobile = "Enter a valid 10 digit mobile number";
    }

    if (!data.captcha.trim()) {
        nextErrors.captcha = "Captcha is required";
    } else if (
        captchaExpected &&
        data.captcha.trim().toUpperCase() !== captchaExpected.toUpperCase()
    ) {
        nextErrors.captcha = "Captcha does not match";
    }

    return nextErrors;
}

function validateStepTwo(
    data: TrnRegistrationData,
    mappings: PersistableEvaluationMapping[],
): ValidationErrors {
    const nextErrors: ValidationErrors = {};
    const expectedMobileOtp =
        mappings.find((mapping) => mapping.fieldPath === "mobileOtp")?.expectedValue ?? "";
    const expectedEmailOtp =
        mappings.find((mapping) => mapping.fieldPath === "emailOtp")?.expectedValue ?? "";

    if (!data.mobileOtp.trim()) {
        nextErrors.mobileOtp = "Mobile OTP is required";
    } else if (expectedMobileOtp && data.mobileOtp.trim() !== expectedMobileOtp) {
        nextErrors.mobileOtp = "Incorrect mobile OTP";
    }

    if (!data.emailOtp.trim()) {
        nextErrors.emailOtp = "Email OTP is required";
    } else if (expectedEmailOtp && data.emailOtp.trim() !== expectedEmailOtp) {
        nextErrors.emailOtp = "Incorrect email OTP";
    }

    return nextErrors;
}

function GSTPortalChrome({
    questionBadge,
    registerHref,
    children,
}: {
    questionBadge: string;
    registerHref: string;
    children: ReactNode;
}) {
    return (
        <div className="gst-sim-page gst-trn-page">
            <div className="gst-sim-top-banner gst-trn-top-banner">
                <span>Simulated website - For Educational purpose only</span>
                <span className="gst-trn-question-badge">
                    Question No: {questionBadge}
                </span>
            </div>

            <div className="gst-sim-access-strip">
                <div className="gst-sim-access-inner">
                    <span>Skip to Main Content</span>
                    <span>0</span>
                    <span>A+</span>
                    <span>A-</span>
                </div>
            </div>

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

                    <div className="gst-sim-auth gst-trn-auth" aria-hidden="true">
                        <Link className="gst-sim-auth-link" href={registerHref}>REGISTER</Link>
                        <button type="button">LOGIN</button>
                    </div>
                </div>
            </header>

            <nav className="gst-sim-nav" aria-label="GST portal">
                <div className="gst-sim-nav-inner gst-trn-nav-inner">
                    {[
                        "Home",
                        "Services",
                        "Dashboard",
                        "GST Law",
                        "Downloads",
                        "Search Taxpayer",
                        "Help and Taxpayer Facilities",
                        "e-Invoice",
                        "News and Updates",
                    ].map((item, index) => (
                        <span key={item} className={index === 0 ? "is-active" : undefined}>
                            {item}
                            {item === "Services" || item === "Downloads" ? (
                                <small>▼</small>
                            ) : null}
                        </span>
                    ))}
                </div>
            </nav>

            {children}

            <footer className="gst-sim-footer gst-trn-footer">
                <div className="gst-sim-footer-main">
                    {GST_FOOTER_COLUMNS.map((column) => (
                        <section key={column.title} className="gst-sim-footer-column">
                            <h2>{column.title}</h2>
                            <ul>
                                {column.items.map((item) => (
                                    <li key={item}>
                                        <a href="#">{item}</a>
                                    </li>
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
                        <div className="gst-sim-footer-contact-block">
                            <p>Log/Track Your Issue:</p>
                            <a href="#">Grievance Redressal Portal for GST</a>
                        </div>
                    </section>
                </div>

                <div className="gst-sim-footer-bottom">
                    <p>
                        Site best viewed at 1024 x 768 resolution in Microsoft Edge,
                        Google Chrome 49+, Firefox 45+ and Safari 6+
                    </p>
                    <Link className="gst-sim-top-button" href={registerHref}>
                        <ChevronUp size={24} strokeWidth={2.6} />
                        <span>Top</span>
                    </Link>
                </div>
            </footer>
        </div>
    );
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

function GSTRadio({
    checked,
    label,
}: {
    checked: boolean;
    label: string;
}) {
    return (
        <label className="gst-trn-radio">
            <span
                className={`gst-trn-radio-mark${checked ? " is-checked" : ""}`}
                aria-hidden="true"
            />
            <span>{label}</span>
        </label>
    );
}

function GSTSelect({
    value,
    placeholder,
    options,
    hasError,
    onChange,
}: {
    value: string;
    placeholder: string;
    options: readonly string[];
    hasError: boolean;
    onChange: (value: string) => void;
}) {
    return (
        <div className={`gst-trn-select-wrap${hasError ? " has-error" : ""}`}>
            <select
                className="gst-trn-select"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            >
                <option value="">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
}

function GSTInput({
    value,
    placeholder,
    hasError,
    prefix,
    icon,
    type = "text",
    maxLength,
    inputMode,
    autoComplete,
    onChange,
}: {
    value: string;
    placeholder: string;
    hasError: boolean;
    prefix?: string;
    icon?: ReactNode;
    type?: string;
    maxLength?: number;
    inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
    autoComplete?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className={`gst-trn-input-wrap${hasError ? " has-error" : ""}`}>
            {icon ? <span className="gst-trn-input-icon">{icon}</span> : null}
            {prefix ? <span className="gst-trn-input-prefix">{prefix}</span> : null}
            <input
                className="gst-trn-input"
                value={value}
                placeholder={placeholder}
                type={type}
                maxLength={maxLength}
                inputMode={inputMode}
                autoComplete={autoComplete}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function GSTFieldError({ message }: { message?: string }) {
    return message ? <p className="gst-trn-field-error">{message}</p> : null;
}

function GSTTrnSimulator({
    questionId,
    onQuestionTitleChange,
}: {
    questionId: string;
    onQuestionTitleChange: (title: string | null) => void;
}) {
    const [mappings, setMappings] = useState<PersistableEvaluationMapping[]>(
        () => getCachedMappings(questionId),
    );
    const [taskId, setTaskId] = useState<string | null>(null);
    const [showExpectedAnswersInEvaluation, setShowExpectedAnswersInEvaluation] =
        useState(false);
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);
    const [data, setData] = useState<TrnRegistrationData>(
        EMPTY_TRN_REGISTRATION_DATA,
    );
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isCompleted, setIsCompleted] = useState(false);
    const [evaluationResults, setEvaluationResults] =
        useState<EvaluationResult | null>(null);
    const [showEvaluationPopup, setShowEvaluationPopup] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [trnNumber, setTrnNumber] = useState("");
    const [startTime] = useState<number>(() => Date.now());
    const hasSavedAttemptRef = useRef(false);

    useEffect(() => {
        async function loadConfig() {
            try {
                const response = await fetch(
                    `/api/simulation/questions/${questionId}/evaluation-config`,
                    { cache: "no-store" },
                );

                if (!response.ok) {
                    throw new Error("Failed to fetch GST simulation configuration");
                }

                const config =
                    (await response.json()) as SimulationEvaluationConfig;

                setTaskId(config.taskId);
                onQuestionTitleChange(config.questionTitle ?? null);
                setShowExpectedAnswersInEvaluation(
                    config.showExpectedAnswersInEvaluation,
                );
                setMappings(config.mappings);
                try {
                    window.localStorage.setItem(
                        `${GST_TRN_MAPPING_CACHE_PREFIX}${questionId}`,
                        JSON.stringify(config.mappings),
                    );
                } catch {
                    // ignore storage errors
                }
            } catch (error) {
                console.error(error);
            }
        }

        void loadConfig();
    }, [onQuestionTitleChange, questionId]);

    useEffect(() => {
        async function persistAttempt() {
            if (
                !isCompleted ||
                !evaluationResults ||
                hasSavedAttemptRef.current
            ) {
                return;
            }

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
            } catch (error) {
                hasSavedAttemptRef.current = false;
                setSaveError(
                    error instanceof Error
                        ? error.message
                        : "Failed to save attempt.",
                );
            }
        }

        void persistAttempt();
    }, [data, evaluationResults, isCompleted, mappings, questionId, startTime, taskId]);

    const captchaCode =
        mappings.find((mapping) => mapping.fieldPath === "captcha")?.expectedValue ??
        "TRN40";
    const mobileOtpHint =
        mappings.find((mapping) => mapping.fieldPath === "mobileOtp")?.expectedValue ??
        "123456";
    const emailOtpHint =
        mappings.find((mapping) => mapping.fieldPath === "emailOtp")?.expectedValue ??
        "123456";
    const districtOptions = useMemo(
        () => getDistrictOptions(data.state),
        [data.state],
    );
    const isPanValid = PAN_REGEX.test(data.pan.trim().toUpperCase());

    function updateField<Key extends keyof TrnRegistrationData>(
        field: Key,
        value: TrnRegistrationData[Key],
    ) {
        setData((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    }

    function handleProceedFromStepOne() {
        const nextErrors = validateStepOne(data, mappings);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setCurrentStep(2);
    }

    function handleSubmitOtp() {
        const nextErrors = validateStepTwo(data, mappings);
        setErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        const endTime = Date.now();
        const results = evaluateRegistration(data, startTime, endTime, mappings);
        const stateCode = data.state.slice(0, 2).toUpperCase() || "TR";
        const generatedTrn = `${stateCode}${data.mobile.slice(-4)}TRN`;

        setTrnNumber(generatedTrn);
        setEvaluationResults(results);
        setIsCompleted(true);
        setShowSuccessModal(true);
    }

    if (isCompleted && evaluationResults) {
        return (
            <>
                <main className="gst-trn-main-shell">
                    <div className="gst-trn-breadcrumb-row">
                        <span>Home</span>
                        <span className="gst-trn-breadcrumb-sep">›</span>
                        <span>Registration</span>
                        <span className="gst-trn-language">English</span>
                    </div>

                    {saveError ? (
                        <div className="gst-trn-save-error">{saveError}</div>
                    ) : null}

                    <section className="gst-trn-success-shell">
                        <div className="gst-trn-success-banner">
                            You have successfully submitted Part A of the registration
                            application. Your TRN is {trnNumber}
                        </div>
                        <div className="gst-trn-success-body">
                            <p>
                                Using this TRN you can access the application form from
                                the dashboard. Please note that Part B of the
                                application form needs to be completed within 15 days,
                                using this TRN.
                            </p>
                            <button type="button" className="gst-trn-success-proceed">
                                PROCEED
                            </button>
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
                            <p>
                                You have successfully completed the TRN Registration.
                            </p>
                            <button
                                type="button"
                                className="gst-trn-success-action"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setShowEvaluationPopup(true);
                                }}
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

    return (
        <main className="gst-trn-main-shell">
            <div className="gst-trn-breadcrumb-row">
                <span>Home</span>
                <span className="gst-trn-breadcrumb-sep">›</span>
                <span>Registration</span>
                <span className="gst-trn-language">English</span>
            </div>

            <section className="gst-trn-card">
                <div className="gst-trn-stepper">
                    <div
                        className={`gst-trn-step-item${
                            currentStep === 1 ? " is-active" : ""
                        }${currentStep > 1 ? " is-complete" : ""}`}
                    >
                        <div className="gst-trn-step-number">
                            {currentStep > 1 ? "✓" : "1"}
                        </div>
                        <div className="gst-trn-step-label">User Credentials</div>
                    </div>
                    <div
                        className={`gst-trn-step-item${
                            currentStep === 2 ? " is-active" : ""
                        }`}
                    >
                        <div className="gst-trn-step-number">2</div>
                        <div className="gst-trn-step-label">OTP Verification</div>
                    </div>
                </div>

                {currentStep === 1 ? (
                    <div className="gst-trn-stage">
                        <div className="gst-trn-stage-header">
                            <h2>New Registration</h2>
                            <p>
                                <span>*</span> indicates mandatory fields
                            </p>
                        </div>

                        <div className="gst-trn-radio-row">
                            <GSTRadio
                                checked={
                                    data.registrationType ===
                                    TRN_REGISTRATION_TYPE_OPTIONS[0]
                                }
                                label={TRN_REGISTRATION_TYPE_OPTIONS[0]}
                            />
                            <GSTRadio
                                checked={
                                    data.registrationType ===
                                    TRN_REGISTRATION_TYPE_OPTIONS[1]
                                }
                                label={TRN_REGISTRATION_TYPE_OPTIONS[1]}
                            />
                        </div>

                        <div className="gst-trn-field-block">
                            <label>I am a <span>*</span></label>
                            <GSTSelect
                                value={data.taxpayerType}
                                placeholder="Select"
                                options={TRN_TAXPAYER_OPTIONS}
                                hasError={Boolean(errors.taxpayerType)}
                                onChange={(value) => updateField("taxpayerType", value)}
                            />
                            <GSTFieldError message={errors.taxpayerType} />
                        </div>

                        <div className="gst-trn-field-block">
                            <label>State / UT <span>*</span></label>
                            <GSTSelect
                                value={data.state}
                                placeholder="Select"
                                options={TRN_STATE_OPTIONS}
                                hasError={Boolean(errors.state)}
                                onChange={(value) => {
                                    updateField("state", value);
                                    updateField("district", "");
                                }}
                            />
                            <GSTFieldError message={errors.state} />
                        </div>

                        <div className="gst-trn-field-block">
                            <label>District <span>*</span></label>
                            <GSTSelect
                                value={data.district}
                                placeholder="Select"
                                options={districtOptions}
                                hasError={Boolean(errors.district)}
                                onChange={(value) => updateField("district", value)}
                            />
                            <GSTFieldError message={errors.district} />
                        </div>

                        <div className="gst-trn-field-block">
                            <label>
                                Legal Name of the Business (As mentioned in PAN) <span>*</span>
                            </label>
                            <GSTInput
                                value={data.legalBusinessName}
                                placeholder="Enter Legal Name of Business"
                                hasError={Boolean(errors.legalBusinessName)}
                                onChange={(value) =>
                                    updateField("legalBusinessName", value)
                                }
                            />
                            <GSTFieldError message={errors.legalBusinessName} />
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Permanent Account Number (PAN) <span>*</span></label>
                            <GSTInput
                                value={data.pan}
                                placeholder="Enter PAN Number"
                                hasError={Boolean(errors.pan)}
                                maxLength={10}
                                autoComplete="off"
                                onChange={(value) =>
                                    updateField(
                                        "pan",
                                        value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10),
                                    )
                                }
                            />
                            <GSTFieldError message={errors.pan} />
                            <p
                                className={`gst-trn-pan-note${
                                    isPanValid ? " is-valid" : ""
                                }`}
                            >
                                Eg: A B C D E 1 2 3 4 X
                            </p>
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Email Address <span>*</span></label>
                            <GSTInput
                                value={data.email}
                                placeholder="Enter Email Address"
                                hasError={Boolean(errors.email)}
                                icon={<Mail size={14} strokeWidth={2.4} />}
                                autoComplete="off"
                                onChange={(value) => updateField("email", value)}
                            />
                            <GSTFieldError message={errors.email} />
                            <p className="gst-trn-helper-note">
                                OTP will be sent to this Email Address
                            </p>
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Mobile Number <span>*</span></label>
                            <GSTInput
                                value={data.mobile}
                                placeholder="Enter Mobile Number"
                                hasError={Boolean(errors.mobile)}
                                prefix="+91"
                                maxLength={10}
                                inputMode="numeric"
                                autoComplete="off"
                                onChange={(value) =>
                                    updateField(
                                        "mobile",
                                        value.replace(/[^0-9]/g, "").slice(0, 10),
                                    )
                                }
                            />
                            <GSTFieldError message={errors.mobile} />
                            <p className="gst-trn-helper-note">
                                Separate OTP will be sent to this mobile number
                            </p>
                        </div>

                        <div className="gst-trn-field-block">
                            <label>
                                Type the characters you see in the image below <span>*</span>
                            </label>
                            <GSTInput
                                value={data.captcha}
                                placeholder="Enter characters as displayed in the CAPTCHA image"
                                hasError={Boolean(errors.captcha)}
                                maxLength={6}
                                autoComplete="off"
                                onChange={(value) =>
                                    updateField("captcha", value.toUpperCase().slice(0, 6))
                                }
                            />
                            <GSTFieldError message={errors.captcha} />
                            <TrnCaptcha className="gst-trn-captcha-box" code={captchaCode} />
                        </div>

                        {saveError ? (
                            <div className="gst-trn-save-error">{saveError}</div>
                        ) : null}

                        <div className="gst-trn-actions">
                            <button
                                type="button"
                                className="gst-trn-primary-button"
                                onClick={handleProceedFromStepOne}
                            >
                                PROCEED
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="gst-trn-stage gst-trn-stage-otp">
                        <div className="gst-trn-stage-header">
                            <h2>Verify OTP</h2>
                            <p>
                                <span>*</span> indicates mandatory fields
                            </p>
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Mobile OTP ({mobileOtpHint}) <span>*</span></label>
                            <GSTInput
                                value={data.mobileOtp}
                                placeholder=""
                                hasError={Boolean(errors.mobileOtp)}
                                type="password"
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="off"
                                onChange={(value) =>
                                    updateField(
                                        "mobileOtp",
                                        value.replace(/[^0-9]/g, "").slice(0, 6),
                                    )
                                }
                            />
                            <GSTFieldError message={errors.mobileOtp} />
                            <p className="gst-trn-helper-note">
                                Enter OTP sent to your mobile number
                            </p>
                        </div>

                        <div className="gst-trn-field-block">
                            <label>Email OTP ({emailOtpHint}) <span>*</span></label>
                            <GSTInput
                                value={data.emailOtp}
                                placeholder=""
                                hasError={Boolean(errors.emailOtp)}
                                type="password"
                                maxLength={6}
                                inputMode="numeric"
                                autoComplete="off"
                                onChange={(value) =>
                                    updateField(
                                        "emailOtp",
                                        value.replace(/[^0-9]/g, "").slice(0, 6),
                                    )
                                }
                            />
                            <GSTFieldError message={errors.emailOtp} />
                            <p className="gst-trn-helper-note">
                                Enter OTP sent to your Email Address
                            </p>
                            <p className="gst-trn-helper-note">
                                Please check the junk/spam folder in case you do not get
                                email.
                            </p>
                            <button type="button" className="gst-trn-link-button">
                                Need OTP to be resent? Click here
                            </button>
                        </div>

                        {saveError ? (
                            <div className="gst-trn-save-error">{saveError}</div>
                        ) : null}

                        <div className="gst-trn-actions gst-trn-actions-otp">
                            <button
                                type="button"
                                className="gst-trn-secondary-button"
                                onClick={() => setCurrentStep(1)}
                            >
                                BACK
                            </button>
                            <button
                                type="button"
                                className="gst-trn-primary-button gst-trn-primary-button-small"
                                onClick={handleSubmitOtp}
                            >
                                PROCEED
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </main>
    );
}

export function GSTTrnRegistrationClient({
    questionId,
    initialMode,
}: GSTTrnRegistrationClientProps) {
    const [questionTitle, setQuestionTitle] = useState<string | null>(null);
    const registerHref = questionId
        ? `/gst-simulation?questionId=${questionId}&mode=register`
        : "/gst-simulation";
    const questionBadge = buildQuestionBadge(questionTitle, questionId);

    return (
        <GSTPortalChrome questionBadge={questionBadge} registerHref={registerHref}>
            {questionId && initialMode === "register" ? (
                <GSTTrnSimulator
                    questionId={questionId}
                    onQuestionTitleChange={setQuestionTitle}
                />
            ) : (
                <GSTLanding registerHref={registerHref} />
            )}
        </GSTPortalChrome>
    );
}
