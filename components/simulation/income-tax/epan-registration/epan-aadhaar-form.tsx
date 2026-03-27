"use client";

interface EPANAadhaarFormProps {
    aadhaarNumber: string;
    checkboxChecked: boolean;
    validationError?: string;
    onAadhaarChange: (value: string) => void;
    onCheckboxChange: (checked: boolean) => void;
    onContinue: () => void;
    onCancel: () => void;
}

export function EPANAadhaarForm({
    aadhaarNumber,
    checkboxChecked,
    validationError,
    onAadhaarChange,
    onCheckboxChange,
    onContinue,
    onCancel,
}: EPANAadhaarFormProps) {
    const isValid = /^\d{12}$/.test(aadhaarNumber);
    const canContinue = isValid && checkboxChecked;

    return (
        <>
            <div className="epan-card epan-aadhaar-card">
                <p className="epan-note">
                    <strong>Remember:</strong> It&apos;s an Aadhaar e-KYC based process and allotment of PAN is free of cost. A pdf
                    file of PAN will be generated and issued to the applicant. Help?
                </p>

                <label htmlFor="epan-aadhaar-input" className="epan-field-label">
                    Enter your 12 digit Aadhaar Number for PAN allotment <span className="epan-required">*</span>
                </label>
                <input
                    id="epan-aadhaar-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={12}
                    className={`epan-text-input ${validationError ? "is-invalid" : ""}`}
                    value={aadhaarNumber}
                    onChange={(event) => onAadhaarChange(event.target.value.replace(/\D/g, "").slice(0, 12))}
                />

                {validationError ? (
                    <div className="epan-inline-error" role="alert">
                        <strong>Error :</strong> {validationError}
                    </div>
                ) : null}

                <label className="epan-checkbox-row">
                    <input
                        type="checkbox"
                        checked={checkboxChecked}
                        onChange={(event) => onCheckboxChange(event.target.checked)}
                    />
                    <span>
                        I confirm that<span className="epan-required">*</span>
                    </span>
                </label>

                <ol className="epan-checklist">
                    <li>I have never been allotted a Permanent Account Number(PAN)</li>
                    <li>My active mobile number is linked with Aadhaar</li>
                    <li>My complete date of birth (DD-MM-YYYY) is available on Aadhaar card</li>
                    <li>I am not minor as on application date of Permanent Account Number(PAN)</li>
                </ol>
            </div>

            <div className="epan-actions epan-actions-outside">
                <button type="button" className="epan-btn epan-btn-secondary" onClick={onCancel}>
                    Cancel
                </button>
                <button type="button" className="epan-btn epan-btn-primary" disabled={!canContinue} onClick={onContinue}>
                    Continue <span aria-hidden="true">›</span>
                </button>
            </div>
        </>
    );
}
