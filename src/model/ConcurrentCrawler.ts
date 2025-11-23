import pLimit from "p-limit";
import { getURLsFromHTML, normalizeURL } from "../crawl";
export class ConcurrentCrawler {
  baseURL: string;
  pages: Record<string, number>;
  limit: ReturnType<typeof pLimit>;
  maxPages: number;
  shouldStop: boolean;
  allTasks: Set<Promise<void>>;
  abortController: AbortController;

  constructor(baseURL: string, maxPages: number, maxConcurrency?: number) {
    this.baseURL = baseURL;
    this.pages = {};
    this.maxPages = maxPages;
    this.limit = pLimit(maxConcurrency ?? 1);
    this.shouldStop = false;
    this.allTasks = new Set();
    this.abortController = new AbortController();
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.shouldStop) return false;

    if (this.pages[normalizedURL] !== undefined) {
      this.pages[normalizedURL]++;
      return false;
    }

    this.pages[normalizedURL] = 1;

    if (Object.keys(this.pages).length >= this.maxPages) {
      this.shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      this.abortController.abort();
      return false;
    }
    return true;
  }

  private async getHTML(baseURL: string): Promise<string> {
    console.log(`Fetching from ${baseURL}`);

    try {
      return await this.limit(async () => {
        const response = await fetch(baseURL, {
          headers: {
            "User-Agent": "BootCrawler/1.0",
          },
        });

        if (response.status >= 400) {
          throw new Error(`Error: got HTTP code ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) {
          throw new Error(
            `Error: non-HTML response , content-type: ${contentType}`
          );
        }

        const html = await response.text();

        return html;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return `[getHTML] Error while fetching ${baseURL}: ${message}`;
    }
  }

  private async crawlPage(currentURL: string): Promise<void> {
    if (this.shouldStop) return;
    console.log(`\n[Crawling] ${currentURL}`);

    //Dont crawl from different domain
    const base = new URL(this.baseURL);
    const curr = new URL(currentURL);

    if (base.hostname !== curr.hostname) {
      console.log(`Skipping external doamin: ${currentURL}`);
      return;
    }

    //Normalize URL
    const normalizedURL = normalizeURL(currentURL);

    //Check if normalizedURL is in pages
    const isNewPage = this.addPageVisit(normalizedURL);
    if (!isNewPage) return;

    //get HTML
    const html = await this.getHTML(currentURL);

    if (!html) {
      console.log(`No HTML for ${currentURL}`);
      return;
    }

    //get links
    const getURLs: string[] = getURLsFromHTML(html, this.baseURL);
    console.log("All the links: ");
    console.log(getURLs);

    // Map into concurrent recursive calls
    const tasks = getURLs.map((url) => {
      const task = this.crawlPage(url).finally(() =>
        this.allTasks.delete(task)
      );

      this.allTasks.add(task);
      return task;
    });

    // VERY IMPORTANT: concurrency happens here
    await Promise.all(tasks);
  }

  public async crawl(): Promise<Record<string, number>> {
    await this.crawlPage(this.baseURL);
    return this.pages;
  }
}
