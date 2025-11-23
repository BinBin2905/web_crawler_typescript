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

export async function getHTML(baseURL: string): Promise<string | any> {
  console.log(`Fetching from ${baseURL}`);

  try {
    const response = await fetch(baseURL, {
      headers: {
        "User-Agent": "BootCrawler/1.0",
      },
    });

    if (response.status >= 400) {
      console.log(`Error: got HTTP code ${response.status}`);
      return;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      console.log(`Error: non-HTML response , content-type: ${contentType}`);
      return;
    }

    const html = await response.text();
    // console.log("\n[HTML OUTPUT START]\n");
    // console.log(html);
    // console.log("\n[HTML OUTPUT END]\n");

    // const data = await response.json();
    // console.log(data);
    return html;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[getHTML] Error while fetching ${baseURL}: ${message}`);
  }
}

export async function crawlPage(
  baseURL: string,
  currentURL: string = baseURL,
  pages: Record<string, number> = {}
): Promise<Record<string, number>> {
  console.log(`\n[Crawling] ${currentURL}`);

  //Dont crawl from different domain

  try {
    const base = new URL(baseURL);
    const curr = new URL(currentURL);

    if (base.hostname !== curr.hostname) {
      console.log(`Skipping external doamin: ${currentURL}`);
      return pages;
    }
  } catch (error) {
    console.log(`Invalid URL: ${currentURL}`);
    return pages;
  }

  //Normalize URL
  const normalizedURL = normalizeURL(currentURL);

  //Check if normalizedURL is in pages
  if (pages[normalizedURL] !== undefined) {
    pages[normalizedURL]++;
    return pages;
  } else pages[normalizedURL] = 1;

  //get HTML
  const html = await getHTML(currentURL);

  if (!html) {
    console.log(`No HTML for ${currentURL}`);
    return pages;
  }

  //get links
  const getURLs: string[] = getURLsFromHTML(html, baseURL);
  console.log("All the links: ");
  console.log(getURLs);

  //iterate with recursion
  for (const url of getURLs) {
    pages = await crawlPage(baseURL, url, pages);
  }

  return pages;
}
