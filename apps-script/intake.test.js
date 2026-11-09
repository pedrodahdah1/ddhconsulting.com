/**
 * Local mocks for apps-script/Code.gs. This does not call Google.
 * Run: node apps-script/intake.test.js
 */
var fs = require("fs");
var path = require("path");
var vm = require("vm");

var checks = [];
function check(name, cond) {
  checks.push({ name: name, ok: !!cond });
  if (!cond) console.error("FAIL " + name);
}

function makeSheet(name) {
  var rows = [];
  var formats = [];
  return {
    _name: name,
    _rows: rows,
    getName: function () { return name; },
    getLastRow: function () {
      var last = 0;
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row) continue;
        for (var j = 0; j < row.length; j++) {
          if (row[j] && row[j].display !== "" && row[j].display != null) last = i + 1;
        }
      }
      return last;
    },
    getLastColumn: function () {
      var last = 0;
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!row) continue;
        for (var j = 0; j < row.length; j++) {
          if (row[j] && row[j].display !== "" && row[j].display != null) last = Math.max(last, j + 1);
        }
      }
      return last;
    },
    getRange: function (r, c, numRows, numCols) {
      var nr = numRows == null ? 1 : numRows;
      var nc = numCols == null ? 1 : numCols;
      return {
        setNumberFormat: function (fmt) {
          for (var i = 0; i < nr; i++) {
            formats[r - 1 + i] = formats[r - 1 + i] || [];
            for (var j = 0; j < nc; j++) formats[r - 1 + i][c - 1 + j] = fmt;
          }
          return this;
        },
        setValues: function (values) {
          for (var i = 0; i < values.length; i++) {
            rows[r - 1 + i] = rows[r - 1 + i] || [];
            for (var j = 0; j < values[i].length; j++) {
              var fmt = formats[r - 1 + i] && formats[r - 1 + i][c - 1 + j];
              rows[r - 1 + i][c - 1 + j] = storeCell(values[i][j], fmt);
            }
          }
        },
        setValue: function (value) { this.setValues([[value]]); },
        getValues: function () {
          var out = [];
          for (var i = 0; i < nr; i++) {
            var line = [];
            for (var j = 0; j < nc; j++) {
              var cell = rows[r - 1 + i] && rows[r - 1 + i][c - 1 + j];
              line.push(cell ? cell.display : "");
            }
            out.push(line);
          }
          return out;
        }
      };
    }
  };
}

function storeCell(value, format) {
  if (value instanceof Date) return { display: value, formula: false, format: format || "" };
  var s = value == null ? "" : String(value);
  var marked = s.charAt(0) === "'";
  var display = marked ? s.substring(1) : s;
  var trigger = display.length > 0 && "=+-@\t\r\uFF1D\u2212".indexOf(display.charAt(0)) !== -1;
  return { display: display, formula: !marked && format !== "@" && trigger, format: format || "" };
}

function createWorld() {
  var sheets = [makeSheet("Intake")];
  var sent = [];
  var quota = 100;
  var failSend = false;
  var failLock = false;
  var failMark = false;
  var day = "2026-11-09";
  var now = 1_000_000;
  var held = 0;
  var duringSend = null;
  var ss = {
    getSheets: function () { return sheets.slice(); },
    getSheetByName: function (name) {
      for (var i = 0; i < sheets.length; i++) if (sheets[i].getName() === name) return sheets[i];
      return null;
    },
    insertSheet: function (name) {
      var sheet = makeSheet(name);
      sheets.unshift(sheet);
      return sheet;
    }
  };
  var context = {
    Date: Date,
    Number: Number,
    String: String,
    Math: Math,
    JSON: JSON,
    RegExp: RegExp,
    Object: Object,
    Array: Array,
    Error: Error,
    console: console,
    SpreadsheetApp: { getActiveSpreadsheet: function () { return ss; } },
    Utilities: {
      formatDate: function () { return day; }
    },
    LockService: {
      getScriptLock: function () {
        return {
          waitLock: function () {
            if (failLock) throw new Error("lock timeout");
            if (held) throw new Error("lock already held");
            held += 1;
          },
          releaseLock: function () { held = Math.max(0, held - 1); }
        };
      }
    },
    MailApp: {
      getRemainingDailyQuota: function () { return quota; },
      sendEmail: function (msg) {
        if (duringSend) {
          var hook = duringSend;
          duringSend = null;
          hook();
        }
        if (failSend) throw new Error("smtp down");
        sent.push(msg);
        return true;
      }
    },
    ContentService: {
      MimeType: { JSON: "application/json" },
      createTextOutput: function (text) {
        return { setMimeType: function () { return this; }, getContent: function () { return text; } };
      }
    }
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "Code.gs"), "utf8"), context, { filename: "Code.gs" });
  context.currentMs_ = function () { return now; };
  var originalMark = context.markNotified_;
  context.markNotified_ = function (id, sentFlag) {
    if (failMark) {
      failMark = false;
      throw new Error("mark failed");
    }
    return originalMark(id, sentFlag);
  };
  return {
    context: context,
    ss: ss,
    sheets: sheets,
    sent: sent,
    setDay: function (value) { day = value; },
    setNow: function (value) { now = value; },
    advance: function (ms) { now += ms; },
    setQuota: function (value) { quota = value; },
    setFailSend: function (value) { failSend = value; },
    setFailLock: function (value) { failLock = value; },
    setFailMark: function (value) { failMark = value; },
    duringSend: function (fn) { duringSend = fn; },
    dataSheet: function () {
      for (var i = 0; i < sheets.length; i++) if (sheets[i].getName() !== "_intake_guard") return sheets[i];
      return null;
    },
    guard: function () { return ss.getSheetByName("_intake_guard"); }
  };
}

function post(world, body) {
  var raw = typeof body === "string" ? body : JSON.stringify(body);
  return JSON.parse(world.context.doPost({ postData: { contents: raw } }).getContent());
}

function applyBody(over) {
  return Object.assign({
    kind: "apply",
    submissionId: "test-intake-2026-11-09-preflight-01",
    name: "Example Person",
    email: "person@example.invalid",
    role: "COO",
    orgType: "Medical group",
    scale: "1 site",
    biTeam: "Yes",
    billingPack: "No",
    systems: "EHR / PMS",
    pain: "Close takes too long.",
    utmSource: "",
    utmMedium: "",
    utmCampaign: "",
    companyWebsite: ""
  }, over || {});
}

function formulas(sheet) {
  var found = [];
  sheet._rows.forEach(function (row, r) {
    (row || []).forEach(function (cell, c) {
      if (cell && cell.formula) found.push({ row: r + 1, col: c + 1, value: cell.display });
    });
  });
  return found;
}

function headerOf(world) {
  return world.dataSheet().getRange(1, 1, 1, 20).getValues()[0].map(function (cell) { return String(cell); });
}

function leadRows(world) {
  var sheet = world.dataSheet();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, 20).getValues();
}

(function validationAndDelivery() {
  var world = createWorld();
  var ok = post(world, applyBody());
  check("valid apply persists and notifies", ok.success === true && ok.persisted === true && ok.notified === true && !ok.duplicate);
  check("server ignores client fit", post(world, applyBody({ submissionId: "test-intake-2026-11-09-preflight-02", fit: "No" })).notified === true);
  var poor = post(world, applyBody({ submissionId: "test-intake-2026-11-09-preflight-03", billingPack: "Yes" }));
  check("billing yes is stored as not a fit", poor.persisted === true && leadRows(world)[2][10] === "No");
  check("unknown org rejected", post(world, applyBody({ orgType: "Hospital" })).code === "invalid");
  check("short id rejected", post(world, applyBody({ submissionId: "short-id" })).code === "invalid");
  check("email newline rejected", post(world, applyBody({ email: "a@example.invalid\nBcc: x@example.invalid" })).code === "invalid");
  check("non-string name rejected", post(world, applyBody({ name: 12 })).code === "invalid");
  check("oversized pain rejected", post(world, applyBody({ pain: "x".repeat(4001) })).code === "invalid");
  check("array body rejected", post(world, "[1,2,3]").code === "invalid");
  check("honeypot stores nothing", post(world, applyBody({ companyWebsite: "https://spam.example" })).skipped === true && leadRows(world).length === 3);
  check("fixed recipient", world.sent.every(function (msg) { return msg.to === "contact@ddhbiconsulting.com"; }));
  check("attacker to field ignored", post(world, applyBody({
    submissionId: "test-intake-2026-11-09-preflight-04",
    to: "attacker@example.invalid"
  })).persisted === true && world.sent[world.sent.length - 1].to === "contact@ddhbiconsulting.com");
  check("reply-to is the applicant", world.sent[0].replyTo === "person@example.invalid");
  check("subject has no newline", world.sent.every(function (msg) { return msg.subject.indexOf("\n") === -1 && msg.subject.indexOf("\r") === -1; }));
  var checkup = post(world, {
    kind: "checkup",
    submissionId: "test-intake-2026-11-09-preflight-05",
    name: "Example",
    email: "person@example.invalid",
    organization: "Example Group\nBcc: x",
    score: "3/10",
    gaps: "- None",
    answers: "1. Yes: question",
    utmSource: "",
    utmMedium: "",
    utmCampaign: ""
  });
  check("checkup subject is one line", checkup.persisted === true && world.sent[world.sent.length - 1].subject === "Health Check: Example Group Bcc: x");
  check("revision is public and not an address", JSON.parse(world.context.doGet().getContent()).revision === "2026-11-09.3");
  check("get does not reveal recipient", world.context.doGet().getContent().indexOf("contact@") === -1);
})();

(function plainTextAndSchema() {
  var world = createWorld();
  post(world, applyBody({
    name: "=1+1",
    role: "+cmd",
    scale: "-1",
    systems: "@sum",
    pain: "\t=tab",
    utmSource: "\uFF1Dlookalike",
    utmMedium: "\u2212minus",
    utmCampaign: "\r=cr"
  }));
  var sheet = world.dataSheet();
  check("no formula cells on the lead log", formulas(sheet).length === 0);
  check("formula-like name is stored as text", leadRows(world)[0][3] === "=1+1");
  check("fullwidth equals stored as text", leadRows(world)[0][16] === "\uFF1Dlookalike");
  check("text columns use plain format", sheet._rows[1][3].format === "@");
  check("timestamp remains a date", leadRows(world)[0][0] instanceof Date);
  check("header matches the 20 names", headerOf(world)[19] === "Notified" && headerOf(world)[0] === "Timestamp");
  check("guard sheet is not the lead log", world.guard().getName() === "_intake_guard" && world.sheets[0].getName() === "_intake_guard");

  var old = createWorld();
  var previous = [
    "Timestamp", "Submission id", "Kind", "Name", "Email", "Role", "Organization type",
    "Locations or providers", "BI team", "Billing company sends a full monthly package",
    "Fit for a Review call", "Systems", "What takes the most time", "Score", "Gaps", "Answers",
    "UTM source", "UTM medium", "UTM campaign"
  ];
  old.dataSheet().getRange(1, 1, 1, previous.length).setValues([previous]);
  old.dataSheet().getRange(2, 1, 1, 2).setValues([["old", "keep-this-row-intact-01"]]);
  var before = JSON.stringify(old.dataSheet()._rows);
  var refused = post(old, applyBody());
  check("old header fails closed", refused.code === "schema" && refused.persisted === false);
  check("old rows were not rewritten", JSON.stringify(old.dataSheet()._rows) === before);
  check("schema failure does not create the guard", old.guard() === null);

  var extra = createWorld();
  post(extra, applyBody());
  extra.dataSheet().getRange(1, 21, 1, 1).setValues([["Notes"]]);
  var extraResult = post(extra, applyBody({ submissionId: "test-intake-2026-11-09-preflight-09" }));
  check("extra header text fails closed", extraResult.code === "schema" && leadRows(extra).length === 1);
})();

(function duplicatesAndMailState() {
  var world = createWorld();
  world.duringSend(function () {
    var mid = post(world, applyBody());
    check("in-flight duplicate does not send", mid.duplicate === true && mid.notified === null && world.sent.length === 0);
  });
  var first = post(world, applyBody());
  check("first send finishes after the overlapping duplicate", first.notified === true && world.sent.length === 1);
  var again = post(world, applyBody({ submissionId: "test-intake-2026-11-09-preflight-06" }));
  check("second id sends once", again.notified === true && world.sent.length === 2);
  var dup = post(world, applyBody());
  check("recorded yes stays yes without another send", dup.duplicate === true && dup.notified === true && world.sent.length === 2 && leadRows(world).length === 2);

  var failed = createWorld();
  failed.setFailSend(true);
  var saved = post(failed, applyBody());
  check("mail failure still persists as no", saved.persisted === true && saved.notified === false && failed.sent.length === 0);
  var retry = post(failed, applyBody());
  check("failed mail is not retried", retry.duplicate === true && retry.notified === false && failed.sent.length === 0);

  var unknown = createWorld();
  unknown.setFailMark(true);
  var unsure = post(unknown, applyBody());
  check("unrecorded mail is unknown", unsure.persisted === true && unsure.notified === null && unknown.sent.length === 1);
  var second = post(unknown, applyBody());
  check("unknown duplicate does not send again", second.duplicate === true && second.notified === null && unknown.sent.length === 1);

  var platform = createWorld();
  platform.setQuota(0);
  var held = post(platform, applyBody());
  check("platform quota stores without sending", held.persisted === true && held.notified === false && platform.sent.length === 0);

  var locked = createWorld();
  locked.setFailLock(true);
  var denied = post(locked, applyBody());
  check("lock failure persists nothing", denied.persisted === false && denied.code === "error" && leadRows(locked).length === 0 && locked.sent.length === 0);
})();

(function capsAndWindow() {
  var burst = createWorld();
  for (var i = 0; i < 8; i++) {
    var result = post(burst, applyBody({ submissionId: "burst-id-" + String(i).padStart(2, "0") + "-0000000000" }));
    check("burst slot " + i, result.persisted === true);
  }
  var blocked = post(burst, applyBody({ submissionId: "burst-id-09-blocked-00000000" }));
  check("ninth row in the window is busy", blocked.code === "busy" && blocked.persisted === false && burst.sent.length === 8);
  burst.advance(burst.context.BURST_MS);
  var after = post(burst, applyBody({ submissionId: "burst-id-10-after-window-0000" }));
  check("burst resets without resetting the day", after.persisted === true && burst.guard().getRange(2, 2, 1, 1).getValues()[0][0] === "9");

  var rollover = createWorld();
  post(rollover, applyBody());
  rollover.setDay("2026-11-10");
  rollover.advance(rollover.context.BURST_MS);
  post(rollover, applyBody({ submissionId: "test-intake-2026-11-10-next-day-0001" }));
  check("a new day resets the row count", rollover.guard().getRange(2, 2, 1, 1).getValues()[0][0] === "1");

  var mail = createWorld();
  for (var m = 0; m < 30; m++) {
    if (m > 0 && m % 8 === 0) mail.advance(mail.context.BURST_MS);
    post(mail, applyBody({ submissionId: "mail-cap-" + String(m).padStart(2, "0") + "-000000000000" }));
  }
  mail.advance(mail.context.BURST_MS);
  var stored = post(mail, applyBody({ submissionId: "mail-cap-30-stored-without-send" }));
  check("mail cap still stores the lead", stored.persisted === true && stored.notified === false && mail.sent.length === 30);

  var aged = createWorld();
  var seed = [["Timestamp", "Submission id"]];
  var oldId = "id-old-should-miss-window-01";
  aged.dataSheet().getRange(1, 1, 1, 20).setNumberFormat("@");
  var header = [];
  for (var h = 0; h < 20; h++) header.push(aged.context.HEADERS[h]);
  aged.dataSheet().getRange(1, 1, 1, 20).setValues([header]);
  for (var r = 0; r < 2001; r++) {
    var id = r === 0 ? oldId : "recent-" + String(r).padStart(4, "0") + "-xxxxxxxxxxxx";
    var line = [];
    for (var c = 0; c < 20; c++) line.push("");
    line[1] = id;
    line[19] = "yes";
    aged.dataSheet().getRange(r + 2, 1, 1, 20).setValues([line]);
  }
  var replay = post(aged, applyBody({ submissionId: oldId }));
  check("id outside 2000 rows is accepted again", replay.persisted === true && replay.duplicate !== true && aged.sent.length === 1);
  var recentId = "recent-2000-xxxxxxxxxxxx";
  var recent = post(aged, applyBody({ submissionId: recentId }));
  check("newest id is still a duplicate", recent.duplicate === true && recent.notified === true && aged.sent.length === 1);
})();

(function pageCopy() {
  var apply = fs.readFileSync(path.join(__dirname, "..", "apply.html"), "utf8");
  var checkup = fs.readFileSync(path.join(__dirname, "..", "checkup.html"), "utf8");
  var intake = fs.readFileSync(path.join(__dirname, "..", "assets", "intake.js"), "utf8");
  var index = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  check("web app url stays empty", /SHEET_WEB_APP_URL = "";/.test(intake));
  check("apply does not claim an inbox copy", apply.indexOf("on its way to your inbox") === -1);
  check("checkup does not claim an inbox copy", checkup.indexOf("on its way to your inbox") === -1);
  check("checkup does not say results are not shared", checkup.indexOf("not shared") === -1);
  check("pages do not claim patient-data detection", apply.indexOf("does not detect or remove it") !== -1 && checkup.indexOf("does not detect or remove it") !== -1);
  check("homepage names the processors without a price edit", index.indexOf("Google Analytics") !== -1 && index.indexOf("Calendly") !== -1);
  check("homepage offer line remains", index.indexOf("Retainer · Forecasts · Board reporting") !== -1);
})();

var failed = checks.filter(function (item) { return !item.ok; });
console.log(JSON.stringify({ pass: checks.length - failed.length, fail: failed.length, failed: failed.map(function (item) { return item.name; }) }, null, 2));
if (failed.length) process.exit(1);
