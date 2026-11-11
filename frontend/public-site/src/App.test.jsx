import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { DEFAULT_PAGE } from "./defaults";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockFetch(status, body) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  );
}

describe("App homepage", () => {
  it("renders default slides and sidebar when the API 404s", async () => {
    mockFetch(404, { message: "Page not found: home" });
    render(<App />);

    expect(await screen.findByText("Temple News")).toBeTruthy();
    expect(screen.getByText("About Us")).toBeTruthy();
    expect(document.title).toBe("Temple of the Feminine Divine");
  });

  it("renders default content on fetch error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    render(<App />);

    expect(await screen.findByText("Temple News")).toBeTruthy();
  });

  it("falls back per-part for a legacy Phase 1 item", async () => {
    mockFetch(200, {
      slug: "home",
      heroHeading: "Old heading",
      missionStatement: "Old mission.",
      body: "Old body.",
      updatedAt: "2026-01-01T00:00:00+00:00",
      updatedBy: "seed",
    });
    render(<App />);

    // No slides/sidebar in the item -> defaults render.
    expect(await screen.findByText("Temple News")).toBeTruthy();
    expect(screen.getByText("About Us")).toBeTruthy();
  });

  it("renders CMS slides when present", async () => {
    mockFetch(200, {
      slides: [{ imageUrl: "/images/custom.jpg", title: "Custom Slide" }],
      sidebar: { title: "Custom Sidebar", text: "Custom text." },
    });
    render(<App />);

    expect(await screen.findByText("Custom Slide")).toBeTruthy();
    expect(screen.getByText("Custom Sidebar")).toBeTruthy();
    expect(screen.queryByText(DEFAULT_PAGE.slides[0].title)).toBeNull();
  });
});
