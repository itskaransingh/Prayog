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
        let logoDataUrlPromise: Promise<string | null> | null = null;
        const currentParams = searchParams?.toString() ?? "";
        const routeSuffix = currentParams ? `?${currentParams}` : "";

        const getPrayogLogoDataUrl = async () => {
            if (!logoDataUrlPromise) {
                logoDataUrlPromise = new Promise((resolve) => {
                    const source = new window.Image();
                    source.onload = () => {
                        const canvas = document.createElement("canvas");
                        canvas.width = source.naturalWidth;
                        canvas.height = source.naturalHeight;

                        const context = canvas.getContext("2d");
                        if (!context) {
                            resolve(null);
                            return;
                        }

                        context.drawImage(source, 0, 0);

                        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                        const { data, width, height } = imageData;
                        let minX = width;
                        let minY = height;
                        let maxX = -1;
                        let maxY = -1;

                        for (let index = 0; index < data.length; index += 4) {
                            const red = data[index];
                            const green = data[index + 1];
                            const blue = data[index + 2];
                            const alpha = data[index + 3];
                            const brightness = Math.max(red, green, blue);
                            const isVisible = alpha > 30 && brightness > 55;

                            if (!isVisible) {
                                data[index + 3] = 0;
                                continue;
                            }

                            const pixelIndex = index / 4;
                            const x = pixelIndex % width;
                            const y = Math.floor(pixelIndex / width);

                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                        }

                        context.putImageData(imageData, 0, 0);

                        if (maxX < minX || maxY < minY) {
                            resolve(null);
                            return;
                        }

                        const paddingX = 24;
                        const paddingY = 14;
                        const cropX = Math.max(0, minX - paddingX);
                        const cropY = Math.max(0, minY - paddingY);
                        const cropWidth = Math.min(width - cropX, maxX - minX + 1 + paddingX * 2);
                        const cropHeight = Math.min(height - cropY, maxY - minY + 1 + paddingY * 2);

                        const croppedCanvas = document.createElement("canvas");
                        croppedCanvas.width = cropWidth;
                        croppedCanvas.height = cropHeight;

                        const croppedContext = croppedCanvas.getContext("2d");
                        if (!croppedContext) {
                            resolve(null);
                            return;
                        }

                        croppedContext.drawImage(
                            canvas,
                            cropX,
                            cropY,
                            cropWidth,
                            cropHeight,
                            0,
                            0,
                            cropWidth,
                            cropHeight,
                        );

                        resolve(croppedCanvas.toDataURL("image/png"));
                    };

                    source.onerror = () => resolve(null);
                    source.src = "/prayog-logo.png";
                });
            }

            return logoDataUrlPromise;
        };

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

        const applyPrayogBranding = async () => {
            const doc = frame.contentDocument;
            if (!doc) {
                return;
            }

            const prayogLogoDataUrl = await getPrayogLogoDataUrl();
            if (!prayogLogoDataUrl) {
                return;
            }

            doc.querySelectorAll<HTMLAnchorElement>("a.logo").forEach((anchor) => {
                anchor.style.display = "inline-flex";
                anchor.style.alignItems = "center";
                anchor.style.gap = "10px";
                anchor.style.textDecoration = "none";

                let prayogIcon = anchor.querySelector<HTMLImageElement>("[data-prayog-icon]");
                if (!prayogIcon) {
                    prayogIcon = doc.createElement("img");
                    prayogIcon.setAttribute("data-prayog-icon", "true");
                    anchor.innerHTML = "";
                    anchor.appendChild(prayogIcon);
                }

                prayogIcon.src = prayogLogoDataUrl;
                prayogIcon.alt = "Prayog Logo";
                prayogIcon.removeAttribute("srcset");
                prayogIcon.style.width = "54px";
                prayogIcon.style.height = "45px";
                prayogIcon.style.objectFit = "contain";
                prayogIcon.style.objectPosition = "left center";
                prayogIcon.style.display = "block";
                prayogIcon.style.maxWidth = "none";
                prayogIcon.style.flexShrink = "0";

                let prayogText = anchor.querySelector<HTMLSpanElement>("[data-prayog-text]");
                if (!prayogText) {
                    prayogText = doc.createElement("span");
                    prayogText.setAttribute("data-prayog-text", "true");
                    anchor.appendChild(prayogText);
                }

                prayogText.textContent = "Prayog";
                prayogText.style.display = "inline-block";
                prayogText.style.fontFamily = "Georgia, 'Times New Roman', serif";
                prayogText.style.fontSize = "28px";
                prayogText.style.fontWeight = "500";
                prayogText.style.lineHeight = "1";
                prayogText.style.color = "#111111";
                prayogText.style.whiteSpace = "nowrap";
            });

            doc.querySelectorAll<HTMLImageElement>(".mobile-logo a img").forEach((img) => {
                img.src = prayogLogoDataUrl;
                img.alt = "Prayog Logo";
                img.removeAttribute("srcset");
                img.style.width = "164px";
                img.style.height = "32px";
                img.style.objectFit = "contain";
                img.style.objectPosition = "left center";
                img.style.display = "block";
                img.style.maxWidth = "none";
            });
        };

        const handleLoad = () => {
            rewritePortalLinks();
            void applyPrayogBranding();
            syncHeight();

            // Re-apply after third-party scripts finish dynamic logo swaps.
            window.setTimeout(() => {
                void applyPrayogBranding();
            }, 300);
            window.setTimeout(() => {
                void applyPrayogBranding();
            }, 1200);

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
            <div
                style={{
                    minHeight: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 16px",
                    background: "#efefef",
                    borderBottom: "1px solid #d6d6d6",
                    color: "#222",
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.1px",
                }}
            >
                Simulation - for educational purposes only
            </div>
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
