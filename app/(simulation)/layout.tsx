import "./simulation.css";
import "./epan-simulation.css";
import "./gst-simulation.css";

export default function SimulationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="sim-portal">
            {children}
        </div>
    );
}
