import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INFO_PAGES } from "../site";
import { mockFetchJson, renderAt } from "../testUtils";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InfoPage", () => {
  it("renders saved content with title and sanitized body", async () => {
    mockFetchJson({
      "/api/pages/about": {
        status: 200,
        body: {
          slug: "about",
          title: "About Us",
          body: "<p>Hello <strong>there</strong>.</p><script>alert(1)</script>",
          bodyFormat: "html",
          updatedAt: "2026-01-01T00:00:00+00:00",
        },
      },
    });
    renderAt("/about");

    expect(await screen.findByRole("heading", { name: "About Us" })).toBeTruthy();
    expect(screen.getByText("there").tagName).toBe("STRONG");
    expect(document.title).toBe("About Us — Temple of the Feminine Divine");
    expect(document.querySelector(".rich-text script")).toBeNull();
  });

  it("shows the Wix default for an unsaved page that has one", async () => {
    mockFetchJson({ "/api/pages/iseum-musicum": { status: 404, body: { message: "nf" } } });
    renderAt("/iseum-musicum");

    expect(await screen.findByRole("heading", { name: "Iseum Musicum" })).toBeTruthy();
    expect(screen.getByText(/School of the Muse/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "More information (PDF)" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Application (PDF)" })).toBeTruthy();
  });

  it("shows an intentional coming-soon state for unsaved pages without defaults", async () => {
    mockFetchJson({ "/api/pages/history": { status: 404, body: { message: "nf" } } });
    renderAt("/history");

    expect(await screen.findByRole("heading", { name: "History" })).toBeTruthy();
    expect(screen.getByText("Content coming soon.")).toBeTruthy();
    expect(document.title).toBe("History — Temple of the Feminine Divine");
  });

  it("shows coming soon for a saved page with an empty body", async () => {
    mockFetchJson({
      "/api/pages/donate": {
        status: 200,
        body: { slug: "donate", title: "Donate", body: "", bodyFormat: "html" },
      },
    });
    renderAt("/donate");

    expect(await screen.findByText("Content coming soon.")).toBeTruthy();
  });

  it("shows a friendly error with retry on non-404 failures", async () => {
    mockFetchJson({ "/api/pages/contact": { status: 500, body: { message: "boom" } } });
    renderAt("/contact");

    expect(await screen.findByText("Couldn't load this page right now.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("renders a legacy plain-text body as paragraphs", async () => {
    mockFetchJson({
      "/api/pages/about": {
        status: 200,
        body: {
          slug: "about",
          title: "About Us",
          body: "First paragraph.\n\nSecond paragraph.",
          bodyFormat: "text",
        },
      },
    });
    renderAt("/about");

    expect(await screen.findByText("First paragraph.")).toBeTruthy();
    expect(screen.getByText("Second paragraph.")).toBeTruthy();
    expect(document.querySelector(".rich-text")).toBeNull();
  });

  it("renders the not-found page for unknown slugs and bad paths", async () => {
    renderAt("/no-such-page");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeTruthy();
    expect(document.title).toBe("Page not found — Temple of the Feminine Divine");

    cleanup();
    renderAt("/about/extra");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeTruthy();
  });

  it("covers every informational slug", () => {
    expect(Object.keys(INFO_PAGES).sort()).toEqual(
      [
        "about", "contact", "donate", "history",
        "honoring-kay", "iseum-musicum", "vision-mission",
      ].sort(),
    );
  });
});
