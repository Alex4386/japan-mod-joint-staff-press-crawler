"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var request_1 = __importDefault(require("request"));
var config_1 = __importDefault(require("./config"));
var jsdom_1 = require("jsdom");
function stripTags(str) {
    return str.replace(/(<([^>]+)>)/ig, "");
}
function getReportIndeces(year) {
    return new Promise(function (resolve, reject) {
        var indexURL = config_1.default.generateMainPage(year);
        request_1.default({
            uri: indexURL,
            headers: {
                "User-Agent": config_1.default.userAgent
            }
        }, function (err, res, body) {
            if (err || res.statusCode != 200) {
                console.error("Indeces get Failed!");
                reject();
            }
            var document = new jsdom_1.JSDOM(body).window.document;
            var aTags = document.getElementsByTagName('a');
            var indeces = [];
            if (aTags.length > 0) {
                for (var _i = 0, aTags_1 = aTags; _i < aTags_1.length; _i++) {
                    var aTag = aTags_1[_i];
                    var nameTestRegex = new RegExp("^" + year.toString(), "g");
                    if (aTag.name !== "" && nameTestRegex.test(aTag.name)) {
                        indeces.push(aTag.name);
                    }
                }
                resolve(indeces);
            }
            else {
                console.log("No Indeces Found!");
                reject();
            }
        });
    });
}
function getReportViaIndex(index) {
    return new Promise(function (resolve, reject) {
        var indexParseResult = /(\d{4})(\d{2})/.exec(index);
        console.log(index);
        if (indexParseResult === null) {
            console.error("index parse failed!");
            reject();
            return;
        }
        var indexYear = parseInt(indexParseResult[1], 10);
        var indexMonth = parseInt(indexParseResult[2], 10);
        var indexURL = config_1.default.generateAPIRequest(indexYear, indexMonth);
        request_1.default({
            uri: indexURL,
            headers: {
                "User-Agent": config_1.default.userAgent
            }
        }, function (err, res, body) {
            if (!err && res.statusCode == 200) {
                var document_1 = new jsdom_1.JSDOM("<html><head></head><body>" + body + "</body></html>").window.document;
                var liTags = document_1.getElementsByTagName('li');
                var newsElements = [];
                if (liTags.length > 0) {
                    for (var _i = 0, liTags_1 = liTags; _i < liTags_1.length; _i++) {
                        var liTag = liTags_1[_i];
                        console.log(liTag);
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
                        var rawTitle = stripTags(liTag.innerHTML);
                        console.log(liTag.innerHTML);
                        var dateParsed = /\d{2}\/\d{2}/.exec(rawTitle);
                        if (dateParsed === null) {
                            continue;
                        }
                        var newsDate = dateParsed[1];
                        var newsOfficial = /［公表］/g.test(rawTitle);
                        var newsTitle = rawTitle.replace(newsDate, "").replace((newsOfficial ? "［公表］" : ""), "");
                        var aTags = liTag.getElementsByTagName("a");
                        var newsReportLink = undefined;
                        if (aTags.length > 0) {
                            var aTag = aTags[0];
                            newsReportLink = aTag.href;
                            if (newsReportLink === undefined) {
                                console.error("news Report Link missing!");
                                reject();
                                return;
                            }
                        }
                        else {
                            console.error("anchor Tag missing!");
                            reject();
                            return;
                        }
                        var newsUUID = newsReportLink.replace(/^.*[\\\/]/, '').split(".")[0];
                        var newsElement = {
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
                }
                else {
                    console.log("FUCK");
                    resolve(newsElements);
                }
            }
        });
    });
}
getReportIndeces(2019).then(function (indeces) {
    for (var _i = 0, indeces_1 = indeces; _i < indeces_1.length; _i++) {
        var index = indeces_1[_i];
        getReportViaIndex(index).then(function (reports) {
            console.log(reports);
        }).catch(function (e) { });
    }
});
