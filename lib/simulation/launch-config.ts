export type LaunchableSimulatorType =
    | "itr_registration"
    | "epan_registration"
    | "classification"
    | "journal_entry"
    | "ledger"
    | "trial_balance"
    | "financial_statement"
    | "gstf-simulation"
    | "none"
    | null
    | undefined;

export interface SimulationLaunchConfig {
    storageKey: string | null;
    gatewayPath: string;
}

const GST_LAUNCH_SUBMODULES = new Set([
    "trn-generation",
    "gst-registration",
    "nil-return-filing-3b",
    "gstr1-filing",
]);

export function getSimulationLaunchConfig({
    moduleSlug,
    submoduleSlug,
    simulatorType,
}: {
    moduleSlug?: string;
    submoduleSlug?: string;
    simulatorType?: LaunchableSimulatorType;
}): SimulationLaunchConfig | null {
    switch (simulatorType) {
        case "epan_registration":
            return {
                storageKey: "epan-registration-started",
                gatewayPath: "/simulation/gateway",
            };
        case "itr_registration":
            return {
                storageKey: "itr-registration-started",
                gatewayPath: "/simulation/gateway",
            };
        case "journal_entry":
            return {
                storageKey: null,
                gatewayPath: "/simulation/render1a",
            };
        case "ledger":
            return {
                storageKey: null,
                gatewayPath: "/simulation/render1b",
            };
        case "trial_balance":
            return {
                storageKey: null,
                gatewayPath: "/simulation/render2a",
            };
        case "financial_statement":
            return {
                storageKey: null,
                gatewayPath: "/simulation/render2b",
            };
        case "classification":
            return {
                storageKey: null,
                gatewayPath: "/simulation/render",
            };
        case "gstf-simulation":
            return {
                storageKey: null,
                gatewayPath: "/gst-simulation",
            };
        case "none":
        case null:
        case undefined:
        default:
            if (
                moduleSlug === "goods-and-service-tax" &&
                submoduleSlug &&
                GST_LAUNCH_SUBMODULES.has(submoduleSlug)
            ) {
                return {
                    storageKey: null,
                    gatewayPath: "/gst-simulation",
                };
            }

            if (submoduleSlug === "financial-statement") {
                return {
                    storageKey: null,
                    gatewayPath: "/simulation/render2b",
                };
            }
            if (submoduleSlug === "preparation-of-trial-balance") {
                return {
                    storageKey: null,
                    gatewayPath: "/simulation/render2a",
                };
            }
            if (submoduleSlug === "journal-entry") {
                return {
                    storageKey: null,
                    gatewayPath: "/simulation/render1a",
                };
            }

            if (moduleSlug === "financial-accounting") {
                return {
                    storageKey: null,
                    gatewayPath: "/simulation/render",
                };
            }

            return null;
    }
}
