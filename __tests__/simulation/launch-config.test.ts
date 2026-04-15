import * as assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getSimulationLaunchConfig } from "../../lib/simulation/launch-config";

describe("simulation launch config", () => {
    it("keeps itr filing style submodules with no simulator binding out of the registration flow", () => {
        const result = getSimulationLaunchConfig({
            moduleSlug: "income-tax",
            simulatorType: "none",
        });

        assert.equal(result, null);
    });

    it("continues launching itr registration tasks through the registration gateway", () => {
        const result = getSimulationLaunchConfig({
            moduleSlug: "income-tax",
            simulatorType: "itr_registration",
        });

        assert.deepEqual(result, {
            storageKey: "itr-registration-started",
            gatewayPath: "/simulation/gateway",
        });
    });

    it("preserves the financial accounting fallback for legacy simulator-less records", () => {
        const result = getSimulationLaunchConfig({
            moduleSlug: "financial-accounting",
            simulatorType: "none",
        });

        assert.deepEqual(result, {
            storageKey: null,
            gatewayPath: "/simulation/render",
        });
    });

    it("routes the supported GST submodules to the GST landing page", () => {
        const result = getSimulationLaunchConfig({
            moduleSlug: "goods-and-service-tax",
            submoduleSlug: "gstr1-filing",
            simulatorType: "none",
        });

        assert.deepEqual(result, {
            storageKey: null,
            gatewayPath: "/gst-simulation",
        });
    });

    it("routes explicit gstf-simulation submodules to the GST landing page", () => {
        const result = getSimulationLaunchConfig({
            moduleSlug: "goods-and-service-tax",
            submoduleSlug: "gstr1-filing",
            simulatorType: "gstf-simulation",
        });

        assert.deepEqual(result, {
            storageKey: null,
            gatewayPath: "/gst-simulation",
        });
    });
});
