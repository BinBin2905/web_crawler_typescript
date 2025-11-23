import { describe, expect, test } from "vitest";
import {
  normalizeURL,
  getH1FromHTML,
  getFirstParagraphFromHTML,
  getURLsFromHTML,
  getImagesFromHTML,
  extractPageData,
  crawlSiteAsync,
} from "../crawl";

const testCase = [
  {
    id: 1,
    input: "https://blog.boot.dev/path/",
    expect: "blog.boot.dev/path",
  },
  {
    id: 2,
    input: "http://blog.boot.dev/path",
    expect: "blog.boot.dev/path",
  },
  {
    id: 3,
    input: "HTTPS://BLOG.BOOT.DEV/PATH/",
    expect: "blog.boot.dev/path",
  },
];

for (let i = 0; i < testCase.length; i++) {
  test(`normalize url case ${testCase[i].id}`, () => {
    expect(normalizeURL(testCase[i].input)).toBe(testCase[i].expect);
  });
}

test("getH1FromHTML basic", () => {
  const inputBody = `<html><body><h1>Test Title</h1></body></html>`;
  const actual = getH1FromHTML(inputBody);
  const expected = "Test Title";
  expect(actual).toEqual(expected);
});

test("getFirstParagraphFromHTML main priority", () => {
  const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
  const actual = getFirstParagraphFromHTML(inputBody);
  const expected = "Main paragraph.";
  expect(actual).toEqual(expected);
});

describe("getURLsFromHTML", () => {
  test("getURLsFromHTML absolute", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `<html><body><a href="https://blog.boot.dev"><span>Boot.dev</span></a></body></html>`;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = ["https://blog.boot.dev/"];

    expect(actual).toEqual(expected);
  });

  test("absolute URL", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `<a href="https://blog.boot.dev/page1">Link</a>`;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = ["https://blog.boot.dev/page1"];

    expect(actual).toEqual(expected);
  });

  test("relative URL", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `<a href="/about">About</a>`;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = ["https://blog.boot.dev/about"];

    expect(actual).toEqual(expected);
  });

  test("multiple links", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `
      <a href="/one">One</a>
      <a href="https://blog.boot.dev/two">Two</a>
      <a href="three">Three</a>
    `;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = [
      "https://blog.boot.dev/one",
      "https://blog.boot.dev/two",
      "https://blog.boot.dev/three",
    ];

    expect(actual).toEqual(expected);
  });
});

describe("getImagesFromHTML", () => {
  test("relative image src", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `<img src="/logo.png" alt="Logo">`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://blog.boot.dev/logo.png"];

    expect(actual).toEqual(expected);
  });

  test("absolute image src", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `<img src="https://cdn.boot.dev/img.png">`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://cdn.boot.dev/img.png"];

    expect(actual).toEqual(expected);
  });

  test("missing src attribute", () => {
    const inputURL = "https://blog.boot.dev";
    const inputBody = `
      <img alt="no src">
      <img src="/valid.png">
    `;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://blog.boot.dev/valid.png"];

    expect(actual).toEqual(expected);
  });
});

test("extractPageData basic", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

  const actual = extractPageData(inputBody, inputURL);
  const expected = {
    url: "https://blog.boot.dev",
    h1: "Test Title",
    first_paragraph: "This is the first paragraph.",
    outgoing_links: ["https://blog.boot.dev/link1"],
    image_urls: ["https://blog.boot.dev/image1.jpg"],
  };

  expect(actual).toEqual(expected);
});

describe("crawlSiteAsync", () => {
  test("maxConcurrency 3", async () => {
    const baseURL = "https://wagslane.dev";
    const pages = await crawlSiteAsync("https://wagslane.dev", 3);

    console.log("\n===== Crawled Pages =====\n");
    console.log(pages);

    // expect(actual).toEqual(expected);
  });

  test("maxConcurrency 5", async () => {
    const baseURL = "https://wagslane.dev";
    const pages = await crawlSiteAsync("https://wagslane.dev", 5);

    console.log("\n===== Crawled Pages =====\n");
    console.log(pages);

    // expect(actual).toEqual(expected);
  });

  test("maxConcurrency 10", async () => {
    const baseURL = "https://wagslane.dev";
    const pages = await crawlSiteAsync("https://wagslane.dev", 10);

    console.log("\n===== Crawled Pages =====\n");
    console.log(pages);

    // expect(actual).toEqual(expected);
  });

  test("maxConcurrency 1", async () => {
    const baseURL = "https://wagslane.dev";
    const pages = await crawlSiteAsync("https://wagslane.dev", 1);

    console.log("\n===== Crawled Pages =====\n");
    console.log(pages);

    // expect(actual).toEqual(expected);
  });
});
