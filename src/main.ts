import * as readline from "node:readline";
import { argv, stdin, stdout } from "node:process";
import {
  collectPageData,
  crawlPage,
  crawlSiteAsync,
  extractPageData,
  getHTML,
} from "./crawl";
import { writeCSVReport } from "./report";

// function askQuestion(query: string): Promise<string> {
//   const rl = readline.createInterface({
//     input: stdin,
//     output: stdout,
//   });

//   return new Promise((resolve) =>
//     rl.question(query, (ans) => {
//       rl.close();
//       resolve(ans);
//     })
//   );
// }

// async function main() {
//   const args = argv.slice(2);

//   if (args.length == 1) {
//     console.log(`Starting crawl of ${args[0]}`);
//     process.exit(0);
//   }

//   if (args.length > 1) {
//     console.log("Error: Too many arguments");
//     process.exit(1);
//   }

//   const answer = await askQuestion("Enter base URL to crawl: ");

//   if (!answer) {
//     console.log("Error: No base URL provided");
//     process.exit(1);
//   }
//   console.log(`Starting crawl of ${answer}`);
//   process.exit(0);
// }

async function main() {
  // await getHTML("https://wagslane.dev");
  // const pages = await crawlPage("https://wagslane.dev");

  // usage: npm run start <URL> <maxPages> <maxConcurrency>
  const pages = await crawlSiteAsync("https://blog.boot.dev", 31, 3);

  console.log("\n===== Crawled Pages =====\n");
  console.log(`Totals pages: ${Object.keys(pages).length}`);
  console.log(pages);

  const pageData = await collectPageData(pages);
  console.log("pageData: ");
  console.log(pageData);
  writeCSVReport(pageData);
}

main();
