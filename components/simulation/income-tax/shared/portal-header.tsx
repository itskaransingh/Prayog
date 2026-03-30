import Link from "next/link";

export function PortalHeader() {
    return (
        <header>
            {/* Top Utility Bar */}
            <div className="sim-utility-bar">
                <div className="sim-utility-left">
                    <span style={{ fontWeight: 500 }}>
                        Income Tax Department
                    </span>
                </div>
                <div className="sim-utility-right">
                    <span className="sim-util-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        Call Us <span style={{ fontSize: 10 }}>▼</span>
                    </span>
                    <div className="sim-util-divider" />
                    <span className="sim-util-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                        English <span style={{ fontSize: 10 }}>▼</span>
                    </span>
                    <div className="sim-util-divider" />
                    <div className="sim-font-controls">
                        <button className="sim-font-btn" type="button">A-</button>
                        <button className="sim-font-btn active" type="button">A</button>
                        <button className="sim-font-btn" type="button">A+</button>
                    </div>
                    <div className="sim-util-divider" />
                    <span className="sim-util-item" style={{ cursor: "pointer" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    </span>
                    <div className="sim-util-divider" />
                    <button className="sim-btn-outline" type="button" onClick={() => alert("Login simulation not implemented. Please use Register.")}>Login</button>
                    <Link href="/simulation" className="sim-btn-filled" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                        Register
                    </Link>
                </div>
            </div>

            {/* Logo Section */}
            <div className="sim-logo-section">
                <div className="sim-logo-container">
                    <div className="sim-logo-placeholder">
                        <div className="sim-logo-icon">🏛️</div>
                        <div className="sim-logo-text">
                            <span className="sim-dept">Income Tax Department</span>
                            <span className="sim-gov">Government of India</span>
                        </div>
                    </div>
                </div>
                <div className="sim-logo-right">
                    <div className="sim-tagline">efiling Anywhere, Anytime</div>
                </div>
            </div>

            {/* Educational Banner */}
            <div className="sim-edu-banner">
                Simulated website for educational purpose only
            </div>

            {/* Main Navigation */}
            <nav className="sim-main-nav">
                <ul className="sim-nav-links">
                    <li><a className="sim-nav-link active" href="#">Home</a></li>
                    <li><a className="sim-nav-link" href="#">Individual/HUF</a></li>
                    <li><a className="sim-nav-link" href="#">Company</a></li>
                    <li><a className="sim-nav-link" href="#">Non-Company</a></li>
                    <li><a className="sim-nav-link" href="#">Tax Professionals &amp; Others</a></li>
                    <li><a className="sim-nav-link" href="#">Downloads</a></li>
                    <li><a className="sim-nav-link" href="#">Help</a></li>
                </ul>
                <div className="sim-nav-right">
                    <span className="sim-nav-call">Call Us</span>
                    <Link
                        href="/simulation"
                        className="sim-btn-filled sim-nav-register"
                        style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    >
                        Register
                    </Link>
                    <button className="sim-nav-search" type="button" aria-label="Search">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </button>
                </div>
            </nav>
        </header>
    );
}
