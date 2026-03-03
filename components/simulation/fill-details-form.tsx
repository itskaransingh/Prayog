"use client";

import { useState, useCallback } from "react";
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
    const [errors, setErrors] = useState<FormErrors>({});

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
        if (validate()) {
            updateData({
                personalDetails: personal,
                addressDetails: address,
                contactDetails: contact,
            });
            onContinue();
        }
    }, [validate, updateData, personal, address, contact, onContinue]);

    const handleBack = useCallback(() => {
        // Persist current edits even on back
        updateData({
            personalDetails: personal,
            addressDetails: address,
            contactDetails: contact,
        });
        onBack();
    }, [updateData, personal, address, contact, onBack]);

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
                <h2 className="sim-form-title">Fill in your details</h2>

                {/* ========== Personal Details ========== */}
                <div className="sim-section">
                    <h3 className="sim-section-title">Personal Details</h3>
                    <div className="sim-form-grid">
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

                        {/* Date of Birth */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">
                                Date of Birth <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                className={`sim-input sim-input-full ${errors.dob ? "error" : ""}`}
                                value={personal.dob}
                                onChange={(e) => updatePersonal("dob", e.target.value)}
                                placeholder="DD/MM/YYYY"
                                maxLength={10}
                            />
                            {fieldError("dob")}
                        </div>
                    </div>

                    {/* Gender — full width row */}
                    <div className="sim-form-row">
                        <label className="sim-field-label">
                            Gender <span className="required">*</span>
                        </label>
                        <div className="sim-radio-group">
                            {(["Male", "Female", "Other"] as const).map((g) => (
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
                </div>

                {/* ========== Address Details ========== */}
                <div className="sim-section">
                    <h3 className="sim-section-title">Address Details</h3>
                    <div className="sim-form-grid">
                        {/* Flat/Door No */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">
                                Flat/Door No <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                className={`sim-input sim-input-full ${errors.flatDoorNo ? "error" : ""}`}
                                value={address.flatDoorNo}
                                onChange={(e) => updateAddress("flatDoorNo", e.target.value)}
                            />
                            {fieldError("flatDoorNo")}
                        </div>

                        {/* Building/Village */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">Building/Village</label>
                            <input
                                type="text"
                                className="sim-input sim-input-full"
                                value={address.building}
                                onChange={(e) => updateAddress("building", e.target.value)}
                            />
                        </div>

                        {/* Road/Street */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">Road/Street</label>
                            <input
                                type="text"
                                className="sim-input sim-input-full"
                                value={address.road}
                                onChange={(e) => updateAddress("road", e.target.value)}
                            />
                        </div>

                        {/* Area/Locality */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">Area/Locality</label>
                            <input
                                type="text"
                                className="sim-input sim-input-full"
                                value={address.area}
                                onChange={(e) => updateAddress("area", e.target.value)}
                            />
                        </div>

                        {/* City */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">
                                City <span className="required">*</span>
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
                    </div>
                </div>

                {/* ========== Contact Details ========== */}
                <div className="sim-section">
                    <h3 className="sim-section-title">Contact Details</h3>
                    <div className="sim-form-grid">
                        {/* Mobile */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">
                                Primary Mobile Number <span className="required">*</span>
                            </label>
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
                            {fieldError("mobile")}
                        </div>

                        {/* Email */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">
                                Email Address <span className="required">*</span>
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

                        {/* Alternate Contact */}
                        <div className="sim-form-row">
                            <label className="sim-field-label">
                                Alternate Contact Number
                            </label>
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
