import telegraf from "telegraf";
import { getReportIndeces, getReportViaIndex, NewsElement } from "./parser";
import fs from "fs";

let previousReport: {
  [index: string]: NewsElement[];
};

try {
  previousReport = JSON.parse(
    fs.readFileSync("report.json", { encoding: "utf-8" })
  );
} catch {
  previousReport = {};
}

let total = {};
let newReports: NewsElement[] = [];
getReportIndeces(new Date().getFullYear()).then(indeces => {
  for (const index of indeces as string[]) {
    getReportViaIndex(index)
      .then(reports => {
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
      })
      .catch(e => {});
  }

  console.log("New Reports: ", newReports);
});
