import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import RichText from "./RichText";

afterEach(cleanup);

describe("RichText", () => {
  it("renders allowed markup", () => {
    const { container } = render(
      <RichText
        html={
          "<h2>Title</h2><p>Some <strong>bold</strong> <em>italic</em> <u>under</u> text.</p>" +
          "<ul><li>one</li><li>two</li></ul><blockquote>wise words</blockquote><hr>"
        }
      />,
    );
    const root = container.querySelector(".rich-text");
    expect(root.querySelector("h2")?.textContent).toBe("Title");
    expect(root.querySelector("strong")).toBeTruthy();
    expect(root.querySelector("em")).toBeTruthy();
    expect(root.querySelector("u")).toBeTruthy();
    expect(root.querySelectorAll("li")).toHaveLength(2);
    expect(root.querySelector("blockquote")).toBeTruthy();
    expect(root.querySelector("hr")).toBeTruthy();
  });

  it("neutralizes script, handlers, and disallowed tags", () => {
    const { container } = render(
      <RichText
        html={
          '<p onclick="alert(1)" style="color:red">hi</p>' +
          "<script>alert(1)</script>" +
          '<img src="x" onerror="alert(1)">' +
          '<iframe src="https://evil.example"></iframe>' +
          "<h1>big</h1>"
        }
      />,
    );
    const root = container.querySelector(".rich-text");
    expect(root.querySelector("script")).toBeNull();
    expect(root.querySelector("img")).toBeNull();
    expect(root.querySelector("iframe")).toBeNull();
    expect(root.querySelector("h1")).toBeNull();
    const p = root.querySelector("p");
    expect(p?.hasAttribute("onclick")).toBe(false);
    expect(p?.hasAttribute("style")).toBe(false);
    // disallowed tags' text content survives (h1 -> plain text)
    expect(root.textContent).toContain("big");
  });

  it("strips dangerous link schemes and forces rel on safe links", () => {
    const { container } = render(
      <RichText
        html={
          '<p><a href="javascript:alert(1)">js</a>' +
          '<a href="data:text/html,x">data</a>' +
          '<a href="java&#9;script:alert(1)">tabbed</a>' +
          '<a href="https://example.com" rel="nofollow">safe</a>' +
          '<a href="mailto:a@b.c">mail</a></p>'
        }
      />,
    );
    const links = [...container.querySelectorAll(".rich-text a")];
    const byText = Object.fromEntries(links.map((a) => [a.textContent, a]));

    // Dangerous hrefs must not survive — attribute removed or scheme gone.
    for (const key of ["js", "data", "tabbed"]) {
      const href = byText[key]?.getAttribute("href") ?? "";
      expect(href).not.toMatch(/javascript|data:|script/i);
    }

    expect(byText.safe?.getAttribute("href")).toBe("https://example.com");
    expect(byText.safe?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(byText.mail?.getAttribute("href")).toBe("mailto:a@b.c");
    expect(byText.mail?.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("keeps relative links", () => {
    const { container } = render(
      <RichText html={'<p><a href="/about">about</a><a href="#top">top</a></p>'} />,
    );
    const links = [...container.querySelectorAll(".rich-text a")];
    expect(links[0]?.getAttribute("href")).toBe("/about");
    expect(links[1]?.getAttribute("href")).toBe("#top");
  });
});
