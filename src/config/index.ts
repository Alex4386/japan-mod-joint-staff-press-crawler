const config = {
  // the index page of press section of ministry of japan press section duh
  mainPage: "https://www.mod.go.jp/js/Press/press.htm",
  mainBaseURL: "https://www.mod.go.jp/js/Press/press",
  generateMainPage: (year: number) => (year == new Date().getFullYear() ? config.mainPage : config.mainBaseURL+year.toString()+".htm"),

  pressAPIBasePage: "https://www.mod.go.jp/js/tpl/Press/",
  generateAPIRequest: (year: number, month: number) => config.pressAPIBasePage+year+
    "/"+year+
    (month < 10 ? "0"+month : month.toString())+".htm",

  // userAgent string when accessing the page.
  // probably they are not gonna ban me but it might possible duh

  // btw ProfWonKimBrowser is an easteregg, surprise~
  userAgent: "Mozilla/5.0 (X11; CrOS x86_64 10066.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36 ProfWonKimBrowser/127.13"
};

export default config;
