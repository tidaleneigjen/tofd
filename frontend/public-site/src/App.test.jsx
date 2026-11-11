import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PAGE } from "./defaults";
import { mockFetchJson, renderAt } from "./testUtils";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("App homepage", () => {
  it("renders default slides and sidebar when the API 404s", async () => {
    mockFetchJson({ "/api/pages/home": { status: 404, body: { message: "Page not found: home" } } });
    renderAt("/");

    expect(await screen.findByText("Temple News")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "About Us" })).toBeTruthy();
    expect(document.title).toBe("Temple of the Feminine Divine");
  });

  it("renders default content on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    renderAt("/");

    expect(await screen.findByText("Temple News")).toBeTruthy();
  });

  it("falls back per-part for a legacy Phase 1 item", async () => {
    mockFetchJson({
      "/api/pages/home": {
        status: 200,
        body: {
          slug: "home",
          heroHeading: "Old heading",
          missionStatement: "Old mission.",
          body: "Old body.",
          updatedAt: "2026-01-01T00:00:00+00:00",
          updatedBy: "seed",
        },
      },
    });
    renderAt("/");

    // No slides/sidebar in the item -> defaults render.
    expect(await screen.findByText("Temple News")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "About Us" })).toBeTruthy();
  });

  it("renders CMS slides when present", async () => {
    mockFetchJson({
      "/api/pages/home": {
        status: 200,
        body: {
          slides: [{ imageUrl: "/images/custom.jpg", title: "Custom Slide" }],
          sidebar: { title: "Custom Sidebar", text: "Custom text." },
        },
      },
    });
    renderAt("/");

    expect(await screen.findByText("Custom Slide")).toBeTruthy();
    expect(screen.getByText("Custom Sidebar")).toBeTruthy();
    expect(screen.queryByText(DEFAULT_PAGE.slides[0].title)).toBeNull();
  });
});
