import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import Layout from "./Layout";

afterEach(cleanup);

function renderLayout(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Layout />
    </MemoryRouter>,
  );
}

describe("Layout nav", () => {
  it("renders all nav links plus the home logo link", () => {
    renderLayout("/");
    for (const label of [
      "Home", "About Us", "Vision & Mission", "History",
      "Honoring Kay", "Iseum Musicum", "Donate", "Contact",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeTruthy();
    }
    expect(
      screen.getByRole("link", { name: "Temple of the Feminine Divine — home" }),
    ).toBeTruthy();
  });

  it("marks the active link with aria-current", () => {
    renderLayout("/about");
    const about = screen.getByRole("link", { name: "About Us" });
    expect(about.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
  });

  it("does not mark Home active on other pages", () => {
    renderLayout("/donate");
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("aria-current")).toBeNull();
    expect(screen.getByRole("link", { name: "Donate" }).getAttribute("aria-current")).toBe("page");
  });

  it("toggles the mobile menu with aria-expanded and closes on Escape", () => {
    renderLayout("/");
    const toggle = screen.getByRole("button", { name: "Menu" });
    const nav = document.getElementById("site-nav");

    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe("site-nav");
    expect(nav.className).not.toContain("site-nav--open");

    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(nav.className).toContain("site-nav--open");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(nav.className).not.toContain("site-nav--open");
  });

  it("closes the menu after navigating", () => {
    renderLayout("/");
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    fireEvent.click(screen.getByRole("link", { name: "Contact" }));
    expect(screen.getByRole("button", { name: "Menu" }).getAttribute("aria-expanded")).toBe("false");
  });
});
