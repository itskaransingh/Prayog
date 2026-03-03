import { PortalHeader } from "@/components/simulation/portal-header";
import { PortalFooter } from "@/components/simulation/portal-footer";
import { RegistrationForm } from "@/components/simulation/registration-form";

export default function SimulationPage() {
    return (
        <>
            <PortalHeader />

            <main className="sim-page-body">
                {/* Breadcrumb */}
                <div className="sim-breadcrumb">
                    <a href="#">Home</a>
                    <span className="sim-breadcrumb-sep">&rsaquo;</span>
                    <span>Register</span>
                </div>

                {/* Progress Stepper */}
                <div className="sim-stepper">
                    <div className="sim-step active">
                        <div className="sim-step-row">
                            <div className="sim-step-number">1</div>
                            <div className="sim-step-connector" />
                        </div>
                        <div className="sim-step-label">Get Started</div>
                    </div>
                    <div className="sim-step">
                        <div className="sim-step-row">
                            <div className="sim-step-number">2</div>
                            <div className="sim-step-connector" />
                        </div>
                        <div className="sim-step-label">Fill Details</div>
                    </div>
                    <div className="sim-step">
                        <div className="sim-step-row">
                            <div className="sim-step-number">3</div>
                            <div className="sim-step-connector" />
                        </div>
                        <div className="sim-step-label">Verify Details</div>
                    </div>
                    <div className="sim-step">
                        <div className="sim-step-row">
                            <div className="sim-step-number">4</div>
                        </div>
                        <div className="sim-step-label">Secure Your Account</div>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="sim-page-heading">
                    Register and find all your tax data in a single secure platform!
                </h1>

                <p className="sim-mandatory-note">
                    <span>*</span> Indicates mandatory fields
                </p>

                {/* Registration Form - Step 1 */}
                <RegistrationForm />
            </main>

            <PortalFooter />
        </>
    );
}
