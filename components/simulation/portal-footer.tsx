export function PortalFooter() {
    return (
        <footer className="sim-footer">
            <div className="sim-footer-grid">
                <div className="sim-footer-col">
                    <h4>About Us</h4>
                    <a href="#">About the Portal</a>
                    <a href="#">History of Direct Taxation</a>
                    <a href="#">Vision, Mission, Values</a>
                    <a href="#">Who We Are</a>
                    <a href="#">Right to Information</a>
                    <a href="#">Organizations &amp; Functions</a>
                    <a href="#">Media Reports</a>
                    <a href="#">e-Filing Calendar 2021</a>
                </div>
                <div className="sim-footer-col">
                    <h4>Contact Us</h4>
                    <a href="#">Helpdesk Numbers</a>
                    <a href="#">Grievances</a>
                    <a href="#">View Grievance</a>
                    <a href="#">Feedback</a>
                    <a href="#">Help</a>
                </div>
                <div className="sim-footer-col">
                    <h4>Using the Portal</h4>
                    <a href="#">Website Policies</a>
                    <a href="#">Accessibility Statement</a>
                    <a href="#">Site Map</a>
                    <a href="#">Browser Support</a>
                </div>
                <div className="sim-footer-col">
                    <h4>Related Sites</h4>
                    <a href="#">Income Tax India</a>
                    <a href="#">NSDL</a>
                    <a href="#">TRACES</a>
                </div>
            </div>

            <div className="sim-footer-bottom">
                <p className="sim-footer-updated" style={{ textAlign: "right" }}>
                    Last reviewed and updated on: 13-Jan-2022
                </p>
                <p>
                    This site is best viewed in 1024 * 768 resolution with latest version of Chrome, Firefox, Safari and Internet Explorer.
                </p>
                <p style={{ marginTop: 8 }}>
                    Copyright © Income Tax Department, Ministry of Finance, Government of India. All Rights Reserved
                </p>
            </div>
        </footer>
    );
}
