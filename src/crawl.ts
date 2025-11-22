import { JSDOM } from "jsdom";

export function normalizeURL(url: string): string {
  try {
    const parsed = new URL(url);

    let host = parsed.hostname.toLowerCase();

    let path = parsed.pathname.toLowerCase();

    if (path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    if (path === "") path = "";

    return `${host}${path}`;
  } catch (err) {
    return "";
  }
}

export function getH1FromHTML(html: string): string | undefined {
  const dom = new JSDOM(html);
  let result: string | undefined =
    dom.window.document.querySelector("h1")?.textContent;
  return result;
}

export function getFirstParagraphFromHTML(html: string): string | undefined {
  const dom = new JSDOM(html);
  let result: string | undefined = dom.window.document
    .querySelector("main")
    ?.querySelector("p")?.textContent;

  return result;
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  let result: string[] = [];
  const dom = new JSDOM(html);
  const document = dom.window.document;
  const a = document.querySelectorAll("a");

  for (const item of a) {
    const href = item.getAttribute("href");
    if (!href) continue;

    try {
      const url = new URL(href, baseURL);
      result.push(url.href);
    } catch (error) {}
  }

  return result;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  let result: string[] = [];

  const dom = new JSDOM(html);
  const img = dom.window.document.querySelectorAll("img");

  for (const src of img) {
    const link = src.getAttribute("src");
    if (!link) continue;

    try {
      const imgLink = new URL(link, baseURL);
      result.push(imgLink.href);
    } catch (error) {}
  }

  return result;
}

type ExtractedPageData = {
  url: string;
  h1?: string;
  first_paragraph?: string;
  outgoing_links?: string[];
  image_urls?: string[];
};
export function extractPageData(
  html: string,
  pageURL: string
): ExtractedPageData {
  const dom = new JSDOM(html);
  const document = dom.window.document;

  let result: ExtractedPageData;

  const h1 = getH1FromHTML(html);
  const url = pageURL;
  const first_paragraph =
    getFirstParagraphFromHTML(html) == undefined
      ? document.querySelector("p")?.textContent
      : getFirstParagraphFromHTML(html);
  let outgoing_links: string[] = getURLsFromHTML(html, pageURL);
  let image_urls: string[] = getImagesFromHTML(html, pageURL);

  result = {
    url: url,
    h1: h1,
    first_paragraph: first_paragraph,
    outgoing_links: outgoing_links,
    image_urls: image_urls,
  };

  return result;
}
