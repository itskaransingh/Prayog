const ALLOWED_TAGS = new Set([
    "A",
    "B",
    "BLOCKQUOTE",
    "BR",
    "CODE",
    "DIV",
    "EM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "I",
    "LI",
    "OL",
    "P",
    "PRE",
    "SPAN",
    "STRONG",
    "U",
    "UL",
]);

const ALLOWED_ATTRS = new Set(["class", "href", "rel", "target"]);

export function sanitizeRichTextHtml(html: string | null | undefined): string {
    if (!html) {
        return "";
    }

    const trimmed = html.trim();
    if (!trimmed) {
        return "";
    }

    if (typeof window === "undefined") {
        return trimmed;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(trimmed, "text/html");

    const cleanNode = (node: Node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;

            if (!ALLOWED_TAGS.has(el.tagName)) {
                const parent = el.parentNode;
                if (!parent) {
                    return;
                }

                while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                }
                parent.removeChild(el);
                return;
            }

            Array.from(el.attributes).forEach((attr) => {
                if (!ALLOWED_ATTRS.has(attr.name)) {
                    el.removeAttribute(attr.name);
                }
            });

            if (el.hasAttribute("class")) {
                const safeClasses = (el.getAttribute("class") ?? "")
                    .split(/\s+/)
                    .filter((className) => /^ql-[a-z0-9-]+$/i.test(className));

                if (safeClasses.length > 0) {
                    el.setAttribute("class", safeClasses.join(" "));
                } else {
                    el.removeAttribute("class");
                }
            }

            if (el.tagName === "A") {
                const href = el.getAttribute("href") ?? "";
                if (!/^https?:\/\//i.test(href)) {
                    el.removeAttribute("href");
                } else {
                    el.setAttribute("target", "_blank");
                    el.setAttribute("rel", "noopener noreferrer");
                }
            }
        }

        Array.from(node.childNodes).forEach(cleanNode);
    };

    Array.from(doc.body.childNodes).forEach(cleanNode);
    return doc.body.innerHTML.trim();
}
