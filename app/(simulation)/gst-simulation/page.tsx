import Image from "next/image";
import Link from "next/link";
import { ChevronUp, Lock } from "lucide-react";

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

interface GSTSimulationPageProps {
    searchParams: Promise<{
        questionId?: string;
    }>;
}

export default async function GSTSimulationPage({
    searchParams,
}: GSTSimulationPageProps) {
    const { questionId } = await searchParams;
    const registerHref = questionId
        ? `/gst-simulation?questionId=${questionId}`
        : "/gst-simulation";

    return (
        <div className="gst-sim-page">
            <div className="gst-sim-top-banner">
                Simulated website - For Educational purpose only
            </div>

            <div className="gst-sim-access-strip">
                <div className="gst-sim-access-inner">
                    <span>Skip to Main Content</span>
                    <span>0</span>
                    <span>A-</span>
                    <span>A+</span>
                </div>
            </div>

            <header className="gst-sim-header">
                <div className="gst-sim-header-inner">
                    <div className="gst-sim-brand">
                        <h1>Goods and Services Tax</h1>
                        <p>Government of India, States and Union Territories</p>
                    </div>

                    <div className="gst-sim-auth">
                        <button type="button">REGISTER</button>
                        <button type="button">LOGIN</button>
                    </div>
                </div>
            </header>

            <nav className="gst-sim-nav" aria-label="GST portal">
                <div className="gst-sim-nav-inner">
                    {[
                        "Home",
                        "Services",
                        "Dashboard",
                        "GST Law",
                        "Downloads",
                        "Search Taxpayer",
                        "Help and Taxpayer Facilities",
                        "e-Invoice",
                    ].map((item, index) => (
                        <span key={item} className={index === 0 ? "is-active" : undefined}>
                            {item}
                            {index === 1 || index === 4 ? " " : ""}
                            {index === 1 || index === 4 ? <small>▼</small> : null}
                        </span>
                    ))}
                </div>
            </nav>

            <div className="gst-sim-news-row">News and Updates</div>

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

            <footer className="gst-sim-footer">
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

                        <div className="gst-sim-footer-socials" aria-label="Social links">
                            <a href="#" aria-label="Facebook">f</a>
                            <a href="#" aria-label="YouTube">▻</a>
                            <a href="#" aria-label="X">X</a>
                            <a href="#" aria-label="LinkedIn">in</a>
                        </div>
                    </section>
                </div>

                <div className="gst-sim-footer-meta">
                    <span>© 2026-27 Goods and Services Tax Network</span>
                    <span>Site Last Updated on 03-04-2026</span>
                    <span>Designed &amp; Developed by GSTN</span>
                </div>

                <div className="gst-sim-footer-bottom">
                    <p>
                        Site best viewed at 1024 x 768 resolution in Microsoft Edge, Google Chrome 49+, Firefox 45+ and Safari 6+
                    </p>
                    <a className="gst-sim-top-button" href="#top">
                        <ChevronUp size={24} strokeWidth={2.6} />
                        <span>Top</span>
                    </a>
                </div>
            </footer>
        </div>
    );
}
