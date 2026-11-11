// Link hrefs entered in the rich-text editor must be absolute https/http or
// mailto — the schemes the API sanitizer treats as meaningful. Anything else
// (javascript:, data:, relative paths, protocol-relative) is rejected here;
// the backend strips disallowed schemes again on save regardless.
const ALLOWED_LINK_HREF = /^(https?:\/\/|mailto:)/i;

export function isAllowedLinkHref(href) {
  return ALLOWED_LINK_HREF.test(String(href ?? "").trim());
}

export const LINK_HREF_HINT = "Links must start with https://, http://, or mailto:";
