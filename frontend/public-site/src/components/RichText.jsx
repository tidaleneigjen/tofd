import DOMPurify from "dompurify";

// Renders CMS HTML. The API already sanitizes bodies with nh3 on save —
// this is defense-in-depth so anything rendered stays inside the same
// allowlist. Keep in parity with RICH_TEXT_* in backend/src/app.py.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    "p", "br", "h2", "h3", "h4", "strong", "em", "u",
    "ul", "ol", "li", "blockquote", "a", "hr",
  ],
  ALLOWED_ATTR: ["href"],
  // https?/mailto absolute links plus relative references; anything with a
  // different scheme (javascript:, data:, ftp:, …) or embedded whitespace
  // (which browsers strip before resolving, e.g. "java\tscript:") is dropped.
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto):[^\s]*|(?!(?:[a-zA-Z][a-zA-Z0-9+.-]*:))[^\s]*)$/i,
};

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export default function RichText({ html }) {
  const clean = DOMPurify.sanitize(html ?? "", SANITIZE_CONFIG);
  return <div className="rich-text" dangerouslySetInnerHTML={{ __html: clean }} />;
}
