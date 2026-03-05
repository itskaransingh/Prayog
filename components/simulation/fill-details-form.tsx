"use client";

import { useState, useCallback, useRef } from "react";
import { useRegistration } from "@/lib/simulation/registration-context";
import type {
    PersonalDetails,
    AddressDetails,
    ContactDetails,
} from "@/lib/simulation/registration-context";
import {
    INDIAN_STATES,
    PINCODE_REGEX,
    MOBILE_REGEX,
    EMAIL_REGEX,
    DOB_REGEX,
} from "@/lib/simulation/constants";

interface FillDetailsFormProps {
    onContinue: () => void;
    onBack: () => void;
}

interface FormErrors {
    firstName?: string;
    lastName?: string;
    dob?: string;
    gender?: string;
    flatDoorNo?: string;
    city?: string;
    state?: string;
    pincode?: string;
    mobile?: string;
    email?: string;
}

export function FillDetailsForm({ onContinue, onBack }: FillDetailsFormProps) {
    const { data, updateData } = useRegistration();

    // Local form state initialised from context (preserves data on back-navigation)
    const [personal, setPersonal] = useState<PersonalDetails>(
        data.personalDetails
    );
    const [address, setAddress] = useState<AddressDetails>(data.addressDetails);
    const [contact, setContact] = useState<ContactDetails>(data.contactDetails);
    const [employer, setEmployer] = useState<string>(data.employer);
    const [errors, setErrors] = useState<FormErrors>({});
    const [activeTab, setActiveTab] = useState<"basic" | "contact">("basic");
    const dobInputRef = useRef<HTMLInputElement | null>(null);

    // ---------- Field updaters ----------

    const updatePersonal = useCallback(
        (field: keyof PersonalDetails, value: string) => {
            setPersonal((prev) => ({ ...prev, [field]: value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        },
        []
    );

    const updateAddress = useCallback(
        (field: keyof AddressDetails, value: string) => {
            setAddress((prev) => ({ ...prev, [field]: value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        },
        []
    );

    const updateContact = useCallback(
        (field: keyof ContactDetails, value: string) => {
            setContact((prev) => ({ ...prev, [field]: value }));
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        },
        []
    );

    // ---------- Validation ----------

    const validate = useCallback((): boolean => {
        const errs: FormErrors = {};

        // Personal Details
        if (!personal.firstName.trim()) errs.firstName = "First Name is required";
        if (!personal.lastName.trim()) errs.lastName = "Last Name is required";
        if (!personal.dob.trim()) {
            errs.dob = "Date of Birth is required";
        } else if (!DOB_REGEX.test(personal.dob)) {
            errs.dob = "Enter DOB in DD/MM/YYYY format";
        }
        if (!personal.gender) errs.gender = "Please select gender";

        // Address Details
        if (!address.flatDoorNo.trim())
            errs.flatDoorNo = "Flat/Door No is required";
        if (!address.city.trim()) errs.city = "City is required";
        if (!address.state) errs.state = "State is required";
        if (!address.pincode.trim()) {
            errs.pincode = "Pincode is required";
        } else if (!PINCODE_REGEX.test(address.pincode)) {
            errs.pincode = "Enter valid 6-digit pincode";
        }

        // Contact Details
        if (!contact.mobile.trim()) {
            errs.mobile = "Mobile number is required";
        } else if (!MOBILE_REGEX.test(contact.mobile)) {
            errs.mobile = "Enter valid 10-digit mobile number";
        }
        if (!contact.email.trim()) {
            errs.email = "Email is required";
        } else if (!EMAIL_REGEX.test(contact.email)) {
            errs.email = "Enter a valid email address";
        }

        setErrors(errs);
        return Object.keys(errs).length === 0;
    }, [personal, address, contact]);

    // ---------- Handlers ----------

    const handleContinue = useCallback(() => {
        if (activeTab === "basic") {
            setActiveTab("contact");
            return;
        }

        if (validate()) {
            updateData({
                personalDetails: personal,
                addressDetails: address,
                contactDetails: contact,
                employer: employer,
            });
            onContinue();
        }
    }, [activeTab, validate, updateData, personal, address, contact, employer, onContinue]);

    const handleBack = useCallback(() => {
        // Persist current edits even on back
        updateData({
            personalDetails: personal,
            addressDetails: address,
            contactDetails: contact,
            employer: employer,
        });
        onBack();
    }, [updateData, personal, address, contact, employer, onBack]);

    // ---------- Error helper ----------

    const fieldError = (field: keyof FormErrors) =>
        errors[field] ? (
            <div className="sim-error-msg">
                <span className="error-label">Error : </span>
                <span className="error-text">{errors[field]}</span>
            </div>
        ) : null;

    // ---------- Render ----------

    return (
        <div className="sim-form-card sim-form-card-full">
            <div className="sim-form-left">
                <h2 className="sim-form-title">Registering as - Individual</h2>

                {/* Tab headers */}
                <div className="sim-tabs">
                    <button
                        type="button"
                        className={`sim-tab-btn ${activeTab === "basic" ? "active" : ""}`}
                        onClick={() => setActiveTab("basic")}
                    >
                        Basic Details
                    </button>
                    <button
                        type="button"
                        className={`sim-tab-btn ${activeTab === "contact" ? "active" : ""}`}
                        onClick={() => setActiveTab("contact")}
                    >
                        Contact Details
                    </button>
                </div>

                {activeTab === "basic" && (
                    <>
                        {/* ========== Basic Details ========== */}
                        <div className="sim-section">
                            <h3 className="sim-section-title">Basic Details</h3>
                            <div className="sim-form-grid">
                                {/* PAN (read-only) */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        PAN <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="sim-input sim-input-full"
                                        value={data.pan}
                                        readOnly
                                    />
                                </div>

                                {/* Last Name */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Last Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`sim-input sim-input-full ${errors.lastName ? "error" : ""}`}
                                        value={personal.lastName}
                                        onChange={(e) => updatePersonal("lastName", e.target.value)}
                                        autoComplete="family-name"
                                    />
                                    {fieldError("lastName")}
                                </div>

                                {/* Middle Name */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">Middle Name</label>
                                    <input
                                        type="text"
                                        className="sim-input sim-input-full"
                                        value={personal.middleName}
                                        onChange={(e) => updatePersonal("middleName", e.target.value)}
                                    />
                                </div>

                                {/* First Name */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        First Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`sim-input sim-input-full ${errors.firstName ? "error" : ""}`}
                                        value={personal.firstName}
                                        onChange={(e) => updatePersonal("firstName", e.target.value)}
                                        autoComplete="given-name"
                                    />
                                    {fieldError("firstName")}
                                </div>

                                {/* Date of Birth with datepicker */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Date of Birth <span className="required">*</span>
                                    </label>
                                    <div
                                        className="sim-date-wrapper"
                                        onClick={() => {
                                            if (dobInputRef.current) {
                                                dobInputRef.current.focus();
                                                // Try to open native picker when supported 
                                                if (dobInputRef.current.showPicker) {

                                                    dobInputRef.current.showPicker();
                                                }
                                            }
                                        }}
                                    >
                                        <input
                                            ref={dobInputRef}
                                            type="date"
                                            className={`sim-input sim-input-full ${errors.dob ? "error" : ""}`}
                                            value={
                                                personal.dob
                                                    ? personal.dob.split("/").reverse().join("-")
                                                    : ""
                                            }
                                            onChange={(e) => {
                                                const iso = e.target.value; // yyyy-mm-dd
                                                if (!iso) {
                                                    updatePersonal("dob", "");
                                                    return;
                                                }
                                                const [yyyy, mm, dd] = iso.split("-");
                                                updatePersonal("dob", `${dd}/${mm}/${yyyy}`);
                                            }}
                                        />
                                    </div>
                                    {fieldError("dob")}
                                </div>
                            </div>

                            {/* Gender — full width row */}
                            <div className="sim-form-row">
                                <label className="sim-field-label">
                                    Gender <span className="required">*</span>
                                </label>
                                <div className="sim-radio-group">
                                    {(["Male", "Female", "Transgender"] as const).map((g) => (
                                        <label key={g} className="sim-radio-label">
                                            <input
                                                type="radio"
                                                name="gender"
                                                className="sim-radio"
                                                value={g}
                                                checked={personal.gender === g}
                                                onChange={() => updatePersonal("gender", g)}
                                            />
                                            {g}
                                        </label>
                                    ))}
                                </div>
                                {fieldError("gender")}
                            </div>

                            {/* Residential Status */}
                            <div className="sim-form-row">
                                <label className="sim-field-label">
                                    Residential Status <span className="required">*</span>
                                </label>
                                <div className="sim-radio-group">
                                    {(["Resident", "Non-resident"] as const).map((status) => (
                                        <label key={status} className="sim-radio-label">
                                            <input
                                                type="radio"
                                                name="residential-status"
                                                className="sim-radio"
                                                value={status}
                                                checked={personal.residentialStatus === status}
                                                onChange={() => updatePersonal("residentialStatus", status)}
                                            />
                                            {status}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "contact" && (
                    <>
                        {/* ========== Contact Details Tab ========== */}
                        <div className="sim-section">
                            <h3 className="sim-section-title">Contact Details</h3>
                            <div className="sim-form-grid">
                                {/* Primary Mobile */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Primary Mobile Number <span className="required">*</span>
                                    </label>
                                    <div className="sim-input-row">
                                        <input
                                            type="text"
                                            className="sim-input"
                                            value="+91"
                                            readOnly
                                            style={{ width: 70 }}
                                        />
                                        <input
                                            type="text"
                                            className={`sim-input sim-input-full ${errors.mobile ? "error" : ""}`}
                                            value={contact.mobile}
                                            onChange={(e) =>
                                                updateContact(
                                                    "mobile",
                                                    e.target.value.replace(/\D/g, "").slice(0, 10)
                                                )
                                            }
                                            maxLength={10}
                                            inputMode="tel"
                                        />
                                    </div>
                                    {fieldError("mobile")}
                                </div>

                                {/* Primary Mobile Belongs to */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Primary Mobile Number Belongs to <span className="required">*</span>
                                    </label>
                                    <select
                                        className="sim-select"
                                        value={contact.mobileBelongsTo}
                                        onChange={(e) => updateContact("mobileBelongsTo", e.target.value)}
                                    >
                                        <option value="">-- Select --</option>
                                        {["Self", "Spouse", "Father", "Mother", "Son", "Daughter", "Other"].map(
                                            (relation) => (
                                                <option key={relation} value={relation}>
                                                    {relation}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Primary Email */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Primary Email ID <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        className={`sim-input sim-input-full ${errors.email ? "error" : ""}`}
                                        value={contact.email}
                                        onChange={(e) => updateContact("email", e.target.value)}
                                        autoComplete="email"
                                    />
                                    {fieldError("email")}
                                </div>

                                {/* Primary Email belongs to */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Primary E-Mail ID belongs to <span className="required">*</span>
                                    </label>
                                    <select
                                        className="sim-select"
                                        value={contact.emailBelongsTo}
                                        onChange={(e) => updateContact("emailBelongsTo", e.target.value)}
                                    >
                                        <option value="">-- Select --</option>
                                        {["Self", "Spouse", "Father", "Mother", "Son", "Daughter", "Other"].map(
                                            (relation) => (
                                                <option key={relation} value={relation}>
                                                    {relation}
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Landline Number */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">Landline Number</label>
                                    <div className="sim-input-row">
                                        <input
                                            type="text"
                                            className="sim-input"
                                            value="+91"
                                            readOnly
                                            style={{ width: 70 }}
                                        />
                                        <input
                                            type="text"
                                            className="sim-input sim-input-full"
                                            value={contact.alternateContact}
                                            onChange={(e) =>
                                                updateContact(
                                                    "alternateContact",
                                                    e.target.value.replace(/\D/g, "").slice(0, 10)
                                                )
                                            }
                                            maxLength={10}
                                            inputMode="tel"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Please Note */}
                        <div className="sim-note-box">
                            <strong>Please Note</strong>
                            <p>
                                On click of &quot;Continue&quot; different OTPs will be sent on Primary Mobile Number
                                and Primary Email Id for verification.
                            </p>
                        </div>

                        {/* Postal Address details under Contact Details */}
                        <div className="sim-section">
                            <h3 className="sim-section-title">Postal Address details</h3>
                            <div className="sim-form-grid">
                                {/* Country */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Country <span className="required">*</span>
                                    </label>
                                    <select className="sim-select" value="INDIA" disabled>
                                        <option value="INDIA">INDIA</option>
                                    </select>
                                </div>

                                {/* Flat/Door/Building */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Flat/Door/Building <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`sim-input sim-input-full ${errors.flatDoorNo ? "error" : ""}`}
                                        value={address.flatDoorNo}
                                        onChange={(e) => updateAddress("flatDoorNo", e.target.value)}
                                    />
                                    {fieldError("flatDoorNo")}
                                </div>

                                {/* Road/Street/Block/Sector */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">Road/Street/Block/Sector</label>
                                    <input
                                        type="text"
                                        className="sim-input sim-input-full"
                                        value={address.road}
                                        onChange={(e) => updateAddress("road", e.target.value)}
                                    />
                                </div>

                                {/* Pincode */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Pincode <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`sim-input sim-input-full ${errors.pincode ? "error" : ""}`}
                                        value={address.pincode}
                                        onChange={(e) =>
                                            updateAddress(
                                                "pincode",
                                                e.target.value.replace(/\D/g, "").slice(0, 6)
                                            )
                                        }
                                        maxLength={6}
                                        inputMode="numeric"
                                    />
                                    {fieldError("pincode")}
                                </div>

                                {/* Area/Locality */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">Area/Locality *</label>
                                    <input
                                        type="text"
                                        className="sim-input sim-input-full"
                                        value={address.area}
                                        onChange={(e) => updateAddress("area", e.target.value)}
                                    />
                                </div>

                                {/* Post Office */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">Post Office *</label>
                                    <input
                                        type="text"
                                        className="sim-input sim-input-full"
                                        value={address.building}
                                        onChange={(e) => updateAddress("building", e.target.value)}
                                    />
                                </div>

                                {/* Town/City/District */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        Town/City/District <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`sim-input sim-input-full ${errors.city ? "error" : ""}`}
                                        value={address.city}
                                        onChange={(e) => updateAddress("city", e.target.value)}
                                    />
                                    {fieldError("city")}
                                </div>

                                {/* State */}
                                <div className="sim-form-row">
                                    <label className="sim-field-label">
                                        State <span className="required">*</span>
                                    </label>
                                    <select
                                        className={`sim-select ${errors.state ? "error" : ""}`}
                                        value={address.state}
                                        onChange={(e) => updateAddress("state", e.target.value)}
                                    >
                                        <option value="">-- Select State --</option>
                                        {INDIAN_STATES.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                    {fieldError("state")}
                                </div>
                            </div>
                        </div>

                        {/* Other Details / Employer Note */}
                        <div className="sim-section">
                            <h3 className="sim-section-title">Other Details</h3>
                            <div className="sim-form-grid">
                                <div className="sim-form-row">
                                    <label className="sim-field-label">Employer / Organization Name</label>
                                    <input
                                        type="text"
                                        className="sim-input sim-input-full"
                                        value={employer}
                                        onChange={(e) => {
                                            setEmployer(e.target.value);
                                            setErrors((prev) => ({ ...prev, employer: undefined }));
                                        }}
                                        placeholder="Enter employer name"
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ========== Actions ========== */}
                <div className="sim-actions sim-actions-row">
                    <button
                        type="button"
                        className="sim-back-btn"
                        onClick={handleBack}
                    >
                        &lsaquo; Back
                    </button>
                    <button
                        type="button"
                        className="sim-continue-btn enabled"
                        onClick={handleContinue}
                    >
                        Continue &rsaquo;
                    </button>
                </div>
            </div>
        </div>
    );
}
