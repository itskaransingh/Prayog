"use client";
// #comment
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function GatewayPage() {
    return (
        <Suspense fallback={<GatewayFallback />}>
            <GatewayPageContent />
        </Suspense>
    );
}

function GatewayPageContent() {
    const frameRef = useRef<HTMLIFrameElement | null>(null);
    const [frameHeight, setFrameHeight] = useState(1000);
    const searchParams = useSearchParams();

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) {
            return;
        }

        let observer: ResizeObserver | null = null;
        const currentParams = searchParams?.toString() ?? "";
        const routeSuffix = currentParams ? `?${currentParams}` : "";

        const syncHeight = () => {
            const doc = frame.contentDocument;
            if (!doc) {
                return;
            }

            const nextHeight = Math.max(
                doc.documentElement.scrollHeight,
                doc.body?.scrollHeight ?? 0,
                1000,
            );
            setFrameHeight(nextHeight);
        };

        const rewritePortalLinks = () => {
            const doc = frame.contentDocument;
            if (!doc) {
                return;
            }

            const rewrites: Array<[string, string]> = [
                [
                    'a[href*="#/register-home"]',
                    `/simulation${routeSuffix}`,
                ],
                [
                    'a[href*="instant-e-pan"]',
                    `/epan-simulation/gateway${routeSuffix}`,
                ],
            ];

            rewrites.forEach(([selector, href]) => {
                doc.querySelectorAll<HTMLAnchorElement>(selector).forEach((link) => {
                    link.href = href;
                    link.target = "_top";
                    link.rel = "";
                    link.onclick = (event) => {
                        event.preventDefault();
                        window.location.assign(href);
                    };
                });
            });
        };

        const handleLoad = () => {
            rewritePortalLinks();
            syncHeight();

            const doc = frame.contentDocument;
            if (!doc?.body) {
                return;
            }

            observer = new ResizeObserver(syncHeight);
            observer.observe(doc.body);
            observer.observe(doc.documentElement);
        };

        frame.addEventListener("load", handleLoad);
        return () => {
            frame.removeEventListener("load", handleLoad);
            observer?.disconnect();
        };
    }, [searchParams]);

    return (
        <main className="sim-portal-embed-shell">
            <iframe
                ref={frameRef}
                className="sim-portal-embed-frame"
                src="/iec/foportal/index.html"
                style={{ height: `${frameHeight}px` }}
                title="Income Tax Portal Landing Page"
            />
        </main>
    );
}

function GatewayFallback() {
    return (
        <main
            className="sim-portal-embed-shell"
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            Loading portal...
        </main>
    );
}
