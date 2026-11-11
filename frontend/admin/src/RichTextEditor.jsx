import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { LINK_HREF_HINT, isAllowedLinkHref } from "./linkHref";

// Toolbar buttons: short visible label + full accessible name. The editor
// only offers markup the API sanitizer keeps (headings 2-3, bold, italic,
// underline, lists, quote, rule, links) — code/strike are disabled.
function ToolbarButton({ label, active, expanded, onClick, children }) {
  return (
    <button
      type="button"
      className="toolbar-btn"
      aria-label={label}
      aria-pressed={active}
      aria-expanded={expanded}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ initialHtml, onChange, labelledBy }) {
  const [linkForm, setLinkForm] = useState(null); // { href, error } | null

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        strike: false,
        link: {
          openOnClick: false,
          validate: (href) => isAllowedLinkHref(href),
          HTMLAttributes: { rel: "noopener noreferrer" },
        },
      }),
    ],
    content: initialHtml,
    // v3 doesn't rerender on transactions by default; the toolbar's
    // aria-pressed states need it.
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: e }) => onChange(e.isEmpty ? "" : e.getHTML()),
    editorProps: {
      attributes: {
        class: "tiptap-body",
        "aria-labelledby": labelledBy,
      },
    },
  });

  if (!editor) {
    return <p className="muted">Loading editor…</p>;
  }

  function openLinkForm() {
    setLinkForm({ href: editor.getAttributes("link").href ?? "", error: "" });
  }

  function applyLink(event) {
    event.preventDefault();
    const href = linkForm.href.trim();
    if (!href) {
      if (editor.isActive("link")) {
        editor.chain().focus().unsetLink().run();
      }
      setLinkForm(null);
      return;
    }
    if (!isAllowedLinkHref(href)) {
      setLinkForm({ ...linkForm, error: LINK_HREF_HINT });
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    setLinkForm(null);
  }

  function removeLink() {
    editor.chain().focus().unsetLink().run();
    setLinkForm(null);
  }

  const btn = (label, text, command, activeCheck, extra) => (
    <ToolbarButton
      key={label}
      label={label}
      active={activeCheck ? editor.isActive(...activeCheck) : false}
      {...extra}
      onClick={() => command()}
    >
      {text}
    </ToolbarButton>
  );

  return (
    <div className="rich-editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
        {btn("Bold", "B", () => editor.chain().focus().toggleBold().run(), ["bold"])}
        {btn("Italic", "I", () => editor.chain().focus().toggleItalic().run(), ["italic"])}
        {btn("Underline", "U", () => editor.chain().focus().toggleUnderline().run(), ["underline"])}
        {btn("Heading 2", "H2", () => editor.chain().focus().toggleHeading({ level: 2 }).run(), ["heading", { level: 2 }])}
        {btn("Heading 3", "H3", () => editor.chain().focus().toggleHeading({ level: 3 }).run(), ["heading", { level: 3 }])}
        {btn("Bullet list", "• List", () => editor.chain().focus().toggleBulletList().run(), ["bulletList"])}
        {btn("Numbered list", "1. List", () => editor.chain().focus().toggleOrderedList().run(), ["orderedList"])}
        {btn("Blockquote", "❝", () => editor.chain().focus().toggleBlockquote().run(), ["blockquote"])}
        {btn("Horizontal line", "―", () => editor.chain().focus().setHorizontalRule().run(), null)}
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          expanded={linkForm !== null}
          onClick={openLinkForm}
        >
          Link
        </ToolbarButton>
      </div>

      {linkForm && (
        <form className="link-form" onSubmit={applyLink}>
          <label htmlFor="link-href">Link address</label>
          <input
            id="link-href"
            type="text"
            inputMode="url"
            value={linkForm.href}
            onChange={(e) => setLinkForm({ ...linkForm, href: e.target.value, error: "" })}
            placeholder="https://…"
          />
          {linkForm.error && (
            <p className="hint link-error" role="alert">
              {linkForm.error}
            </p>
          )}
          <div className="link-form-actions">
            <button type="submit" className="small">
              Apply
            </button>
            {editor.isActive("link") && (
              <button type="button" className="small danger" onClick={removeLink}>
                Remove link
              </button>
            )}
            <button type="button" className="small secondary" onClick={() => setLinkForm(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
