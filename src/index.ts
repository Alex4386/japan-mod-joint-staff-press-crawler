import Telegraf from "telegraf";
import { getReportIndeces, getReportViaIndex, NewsElement } from "./parser";
import fs from "fs";
import { getNewNews, newReports, getDateNews, previousReport } from "./news";
import { dateGenerator, indexGenerator } from "./util";
import config from "./config";

export function newsSerialize(news: NewsElement[]) {
  if (news.length === 0) {
    return "뉴스 정보가 없습니다.";
  }
  let serialized = `
가져온 뉴스 정보입니다:
`;

  for (const thisNews of news) {
    serialized += `
날짜: ${thisNews.date}
공식 여부: ${thisNews.official ? "공식" : "알 수 없음"}
제목: ${thisNews.title}
리포트 PDF: https://www.mod.go.jp${thisNews.reportLink}
`;
  }
  return serialized;
}

const botConfig: {
  bot_token: string;
  subscriberChatId: number[];
} = JSON.parse(fs.readFileSync("./bot-config.json", { encoding: "utf-8" }));
const bot = new Telegraf(botConfig.bot_token);

bot.start(msg =>
  msg.reply(
    `일본방위성 통합막료감부 자동리포트 봇 입니다. 
developed by Alex4386
Source code available @
https://github.com/Alex4386/japan-mod-joint-press-crawler
`
  )
);

bot.command("today", msg => {
  (async () => {
    await getDateNews(dateGenerator(new Date()));
    msg.reply(newsSerialize(newReports));
  })();
});

bot.command("this_month", msg => {
  (async () => {
    msg.reply(
      newsSerialize(
        previousReport[
          indexGenerator(new Date().getFullYear(), new Date().getMonth())
        ]
      )
    );
  })();
});

bot.command("last_month", msg => {
  (async () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    msg.reply(
      newsSerialize(
        previousReport[indexGenerator(date.getFullYear(), date.getMonth())]
      )
    );
  })();
});

bot.command("get_new", msg => {
  (async () => {
    await getNewNews();
    msg.reply(newsSerialize(newReports));
  })();
});

bot.command("subscribe", msg => {
  msg.reply("등록 처리 중입니다...");
  if (msg.chat !== undefined) {
    if (botConfig.subscriberChatId.indexOf(msg.chat.id) === -1) {
      botConfig.subscriberChatId.push(msg.chat.id);
      fs.writeFileSync("./bot-config.json", JSON.stringify(botConfig));
      msg.reply("등록 처리가 완료되었습니다.");
    } else {
      msg.reply("이미 등록처리가 되어있습니다.");
    }
  } else {
    msg.reply("등록 실패 하였습니다.");
  }
});

bot.command("unsubscribe", msg => {
  msg.reply("등록해제 처리 중입니다...");
  if (msg.chat !== undefined) {
    if (botConfig.subscriberChatId.indexOf(msg.chat.id) === -1) {
      msg.reply("등록된 적이 없는 채팅입니다.");
    }
    botConfig.subscriberChatId.splice(
      botConfig.subscriberChatId.indexOf(msg.chat.id),
      1
    );
    fs.writeFileSync("./bot-config.json", JSON.stringify(botConfig));
    msg.reply("등록해제 처리가 완료되었습니다.");
  } else {
    msg.reply("등록해제 실패 하였습니다.");
  }
});

setInterval(async () => {
  console.log("업데이트 중");
  const reports = await getNewNews();
  if (reports !== null) {
    for (const subscriberId of botConfig.subscriberChatId) {
      await bot.telegram.sendMessage(
        subscriberId,
        "새로운 리포트가 감지되었습니다.\n" + newsSerialize(newReports)
      );
    }
  }
}, 1000 * 60 * 60 * 30);

(async () => {
  console.log("업데이트 중");
  const reports = await getNewNews();
  if (reports !== null) {
    for (const subscriberId of botConfig.subscriberChatId) {
      await bot.telegram.sendMessage(
        subscriberId,
        "새로운 리포트가 감지되었습니다.\n" + newsSerialize(newReports)
      );
    }
  }
})();

bot.launch();
