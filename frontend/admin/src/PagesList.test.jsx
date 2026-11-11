import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PagesList from "./PagesList";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function mockList(list) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(list),
    }),
  );
}

function renderList() {
  return render(
    <MemoryRouter>
      <PagesList />
    </MemoryRouter>,
  );
}

describe("PagesList", () => {
  it("lists all eight pages with not-yet-written status", async () => {
    mockList([]);
    renderList();

    for (const label of [
      "Home", "About Us", "Vision & Mission", "History",
      "Honoring Kay", "Iseum Musicum", "Donate", "Contact",
    ]) {
      expect(await screen.findByRole("link", { name: label })).toBeTruthy();
    }
    expect(screen.getAllByText("Not yet written")).toHaveLength(8);
    expect(screen.getAllByRole("link", { name: "Edit" })).toHaveLength(8);
  });

  it("shows last-updated info and links to each editor route", async () => {
    mockList([
      { slug: "home", title: "Home", updatedAt: "2026-11-10T12:00:00+00:00" },
      { slug: "about", title: "About Us", updatedAt: "2026-11-11T08:30:00+00:00" },
    ]);
    renderList();

    expect((await screen.findAllByText(/Last updated/)).length).toBe(2);
    expect(screen.getAllByText("Not yet written")).toHaveLength(6);

    const aboutEdit = screen.getAllByRole("link", { name: "Edit" })[1];
    expect(aboutEdit.getAttribute("href")).toBe("/pages/about");
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink.getAttribute("href")).toBe("/pages/home");
  });

  it("shows a friendly error with retry on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: () => Promise.resolve({}) }),
    );
    renderList();

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
