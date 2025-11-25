import * as fs from "node:fs";
import * as path from "node:path";
import type { ExtractedPageData } from "./crawl";

export function writeCSVReport(
  pageData: Record<string, ExtractedPageData>,
  fileName: string = "report.csv"
): void {
  const filePath = path.resolve(process.cwd(), fileName);
  const headers: string[] = [
    "page_url",
    "h1",
    "first_paragraph",
    "outgoing_link_urls",
    "image_urls",
  ];
  const rows: string[] = [headers.join(",")];

  for (const page of Object.values(pageData)) {
    const page_url = page.url ?? "";
    const h1 = page.h1 ?? "";
    const first_paragraph = page.first_paragraph ?? "";
    const outgoing_link_urls = (page.outgoing_links ?? []).join(";");
    const image_urls = (page.image_urls ?? []).join(";");

    const escapedRows: string[] = [
      csvEscape(page_url),
      csvEscape(h1),
      csvEscape(first_paragraph),
      csvEscape(outgoing_link_urls),
      csvEscape(image_urls),
    ];

    rows.push(escapedRows.join(","));
  }

  const csvContent = rows.join("\n");
  fs.writeFileSync(filePath, csvContent, "utf8");

  console.log(`CSV report written to: ${filePath}`);
}

function csvEscape(field: string) {
  const str = field ?? "";
  const needsQuoting = /[",\n]/.test(str);
  const escaped = str.replace(/"/g, '""');
  return needsQuoting ? `"${escaped}"` : escaped;
}
