import "./simulation.css";

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
