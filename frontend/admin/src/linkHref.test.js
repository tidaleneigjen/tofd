import { describe, expect, it } from "vitest";
import { isAllowedLinkHref } from "./linkHref";

describe("isAllowedLinkHref", () => {
  it("accepts https, http, and mailto links", () => {
    expect(isAllowedLinkHref("https://example.com/page")).toBe(true);
    expect(isAllowedLinkHref("http://example.com")).toBe(true);
    expect(isAllowedLinkHref("mailto:a@b.c")).toBe(true);
    expect(isAllowedLinkHref("HTTPS://EXAMPLE.COM")).toBe(true);
    expect(isAllowedLinkHref("  https://example.com  ")).toBe(true);
  });

  it("rejects other schemes and relative URLs", () => {
    for (const href of [
      "javascript:alert(1)",
      "data:text/html,x",
      "ftp://example.com/f",
      "/about",
      "#section",
      "//example.com",
      "example.com",
      "",
      null,
      undefined,
    ]) {
      expect(isAllowedLinkHref(href), String(href)).toBe(false);
    }
  });
});
