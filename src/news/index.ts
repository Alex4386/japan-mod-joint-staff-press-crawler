import { getReportIndeces, getReportViaIndex, NewsElement } from "../parser";
import fs from "fs";

export let previousReport: {
  [index: string]: NewsElement[];
};

try {
  previousReport = JSON.parse(
    fs.readFileSync("report.json", { encoding: "utf-8" })
  );
} catch {
  previousReport = {};
}

export let total = {};
export let newReports: NewsElement[] = [];

export function getDateNews(date: string, year?: string) {
  const month = date.slice(0, 2);
  const index = (year === undefined ? new Date().getFullYear() : year) + month;

  const newsList = [];
  for (const thisNews of previousReport[index]) {
    if (thisNews.date === date) {
      newsList.push(thisNews);
    }
  }
  return newsList;
}

export async function getNewNews() {
  const indeces = await getReportIndeces(new Date().getFullYear());
  const bakNewReports = newReports;

  for (const index of indeces as string[]) {
    const reports = await getReportViaIndex(index);
    reports.sort(
      (a, b) =>
        parseInt(a.uuid.replace(/\D+/g, "")) -
        parseInt(b.uuid.replace(/\D+/g, ""))
    );
    total = { ...total, [index]: reports };
    //console.log("writing to file...");
    fs.writeFileSync("report.json", JSON.stringify(total), {
      encoding: "utf-8"
    });
    const prevReports =
      previousReport[index] === undefined ? [] : previousReport[index];
    //console.log("prevReports", prevReports);
    for (const report of reports) {
      const duplicateReport = prevReports.find(
        prevReport => prevReport.uuid === report.uuid
      );
      if (typeof duplicateReport === "undefined") {
        // this is new:
        //console.log("not found", duplicateReport);
        newReports.push(report);
      } else {
        //console.log("found", duplicateReport);
      }
    }
    //console.log("New Reports: ", newReports);
  }
  if (newReports.length === 0) {
    newReports = bakNewReports;
    return null;
  }

  previousReport = JSON.parse(
    fs.readFileSync("report.json", { encoding: "utf-8" })
  );
  console.log("New Reports: ", newReports);
  return newReports;
}
