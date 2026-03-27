import "@/app/(simulation)/epan-simulation.css";

export default function EPANSimulationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="epan-simulation-root">
            {children}
        </div>
    );
}
