"use client";

import Image from "next/image";

interface EPANDashboardProps {
    onGetNewEPAN: () => void;
    onCheckStatus: () => void;
}

export function EPANDashboard({ onGetNewEPAN, onCheckStatus }: EPANDashboardProps) {
    const highlightItems = [
        {
            iconSrc: "/epan/easyepan.svg",
            iconAlt: "Easy and Paperless Process",
            title: "Easy & Paperless Process",
        },
        {
            iconSrc: "/epan/getepan.svg",
            iconAlt: "Get e-Pan within 10 Minutes",
            title: "Get e-Pan within 10 Minutes",
        },
        {
            iconSrc: "/epan/holdsepan.svg",
            iconAlt: "Holds Same Value as Physical PAN Card",
            title: "Holds Same Value as Physical PAN Card",
        },
        {
            iconSrc: "/epan/allepan.svg",
            iconAlt: "All You Need is Aadhaar Card and Linked Mobile Number",
            title: "All You Need is Aadhaar Card & Linked Mobile Number",
        },
    ] as const;

    return (
        <div className="epan-dashboard-container">
            <div className="epan-breadcrumb epan-dashboard-breadcrumb">
                <span>Home</span>
                <span>›</span>
                <span>e-PAN</span>
            </div>

            <div className="epan-dashboard-content">
                <h1 className="epan-dashboard-title">e-PAN</h1>
                <p className="epan-dashboard-subtitle">
                    e-PAN is for allotment of instant PAN (on near-real time basis) for those applicants who possess a valid Aadhaar
                    number. PAN is issued in PDF format to applicants, which is free of cost.
                </p>

                <section className="epan-highlight-strip" aria-label="e-PAN highlights">
                    {highlightItems.map((item) => (
                        <div key={item.title} className="epan-highlight-item">
                            <Image src={item.iconSrc} alt={item.iconAlt} width={48} height={48} className="epan-highlight-icon" />
                            <p>{item.title}</p>
                        </div>
                    ))}
                </section>

                <div className="epan-action-cards">
                    <div className="epan-action-card">
                        <div className="epan-action-card-body">
                            <h2 className="epan-action-title">Get New e-PAN</h2>
                            <p className="epan-action-desc">
                                e-PAN is a digitally signed PAN card issued in electronic format based on e-KYC data of aadhaar
                            </p>
                        </div>
                        <div className="epan-action-card-footer">
                            <button type="button" className="epan-dashboard-link" onClick={onGetNewEPAN}>
                                Get New e-PAN
                            </button>
                        </div>
                    </div>

                    <div className="epan-action-card">
                        <div className="epan-action-card-body">
                            <h2 className="epan-action-title">Check Status/Download PAN</h2>
                            <p className="epan-action-desc">Check status of pending e-PAN request/ Download e-PAN</p>
                        </div>
                        <div className="epan-action-card-footer">
                            <button type="button" className="epan-dashboard-link" onClick={onCheckStatus}>
                                Continue
                            </button>
                        </div>
                    </div>
                </div>

                <div className="epan-help-block">
                    <h2>Need Help?</h2>
                    <ul>
                        <li><a href="#">User Manual</a></li>
                        <li><a href="#">FAQs</a></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
