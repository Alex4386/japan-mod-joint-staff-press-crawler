import request from "request";
import config from "./config";
import { JSDOM } from "jsdom";
import fs from "fs";

interface NewsElement {
  uuid: string;
  date: string;
  official: boolean;
  title: string;
  reportLink: string;
  
  rawData?: {
    title: string;
  }
}

function stripTags(str: string) {
  return str.replace(/(<([^>]+)>)/ig,"");
}

function getReportIndeces(year: number) {
  return new Promise<string[]>(
    (resolve, reject) => {
      const indexURL = config.generateMainPage(year);

      request({
        uri: indexURL,
        headers: {
          "User-Agent": config.userAgent
        }
      }, (err, res, body) => {
        if (err || res.statusCode != 200) {
          console.error("Indeces get Failed!");
          reject();
        }

        const { document } = new JSDOM(body).window;
        const aTags = document.getElementsByTagName('a') as unknown as HTMLAnchorElement[];
        const indeces = [];

        if (aTags.length > 0) {
          for (const aTag of aTags) {
            const nameTestRegex = new RegExp("^"+year.toString(), "g");

            if (aTag.name !== "" && nameTestRegex.test(aTag.name)) {
              indeces.push(aTag.name);
            }
          }

          resolve(indeces);
        } else {
          console.log("No Indeces Found!");

          reject();
        }
      });
    }
  )
}

function getReportViaIndex(index: string) {
  return new Promise<NewsElement[]>(
    (resolve, reject) => {

      const indexParseResult = /(\d{4})(\d{2})/.exec(index);
      
      console.log(index);
      if (indexParseResult === null) { console.error("index parse failed!"); reject(); return; }

      const indexYear = parseInt(indexParseResult[1], 10);
      const indexMonth = parseInt(indexParseResult[2], 10);

      const indexURL = config.generateAPIRequest(indexYear, indexMonth);

      request({
        uri: indexURL,
        headers: {
          "User-Agent": config.userAgent
        }
      }, (err, res, body) => {
        if (!err && res.statusCode == 200) {
          const { document } = new JSDOM("<html><head></head><body>"+body+"</body></html>").window;

          const liTags = document.getElementsByTagName('li') as unknown as HTMLLIElement[];
          const newsElements: NewsElement[] = [];
          
          if (liTags.length > 0) {
            for (const liTag of liTags) {
              /* 
               * Data structure:
               * <li>
               *   <a href="fileLocation" target="_blank">
               *     Date
               *     <span class="LR-5">[Official unOffical Identifier]</span>
               *     Title
               *   </a>
               * </li>
               * 
               * Aw shit, Here we go again. DOM magic time.
               */

              // JSDOM doesn't work with innerText, very... well..
              const rawTitle = stripTags(liTag.innerHTML);
              const dateParsed = /\d{2}\/\d{2}/.exec(rawTitle);
              if (dateParsed === null) {
                continue;
              }
              const newsDate = dateParsed[0];
              const newsOfficial = /［公表］/g.test(rawTitle);
              
              // I don't know the string for unofficial. duh.
              const newsTitle = rawTitle.replace(newsDate, "").replace(
                (newsOfficial ? "［公表］" : ""), ""
              );
  
              const aTags = liTag.getElementsByTagName("a");
              let newsReportLink = undefined;
              if (aTags.length > 0) {
                const aTag = aTags[0];
                newsReportLink = aTag.href;
                if (newsReportLink === undefined) { console.error("news Report Link missing!"); reject(); return;}
              } else {
                reject();
                return;
              }
              const newsUUID = newsReportLink.replace(/^.*[\\\/]/, '').split(".")[0];
  
              const newsElement: NewsElement = {
                rawData: {
                  title: rawTitle
                },
                title: newsTitle,
                official: newsOfficial,
                reportLink: newsReportLink,
                date: newsDate,
                uuid: newsUUID
              };
  
              newsElements.push(newsElement);
            }
  
            resolve(newsElements);
          } else {
            resolve(newsElements);
          }
  
  
        }

      });
    }
  )
}

let total = {};
getReportIndeces(2019).then(
  indeces => {
    for (const index of indeces) {
      getReportViaIndex(index).then(
        reports => {
          reports.sort((a,b) => parseInt(a.uuid.replace(/\D+/g, '')) - parseInt(b.uuid.replace(/\D+/g, '')));
          total = { ...total, [index]: reports };
          fs.writeFileSync("report.json", JSON.stringify(total), {encoding: "utf-8"})
        }
      ).catch(e => {})
    }

  }
);

