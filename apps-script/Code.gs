/**
 * @OnlyCurrentDoc
 *
 * DDH Consulting intake. Container-bound to one spreadsheet.
 * Deploy as a web app: Execute as me, access Anyone.
 * See SETUP.md before replacing the live URL.
 *
 * Revision is returned by doGet so a read-only GET can identify this file.
 * It is not a secret and it does not prove which Google scopes were granted.
 *
 * The first sheet whose name is not "_intake_guard" is the lead log.
 * The script creates "_intake_guard" for its own counters. Those counters are
 * global to this script, not a per-person identity. There is no client secret.
 *
 * A header row that does not match HEADERS is left untouched and the
 * submission is refused. This file does not request Gmail read access.
 */
var INTAKE_REVISION = "2026-11-09.3";
var NOTIFY = "contact@ddhbiconsulting.com";
var MAX_BODY = 30000;
var GUARD_SHEET = "_intake_guard";
var DEDUP_ROWS = 2000;
var BURST_LIMIT = 8;
var BURST_MS = 10 * 60 * 1000;
var DAILY_ROW_LIMIT = 40;
var DAILY_MAIL_LIMIT = 30;
var ORG_TYPES = {
  "Medical practice": true,
  "Medical group": true,
  "Physician practice": true,
  "Specialty group": true,
  "ASC": true,
  "Pharmacy group": true,
  "Imaging": true,
  "MSO or PE group": true,
  "Other healthcare organization": true
};

var HEADERS = [
  "Timestamp",
  "Submission id",
  "Kind",
  "Name",
  "Email",
  "Role",
  "Organization type",
  "Locations or providers",
  "BI team",
  "Billing company sends a full monthly package",
  "Fit for a Review call",
  "Systems",
  "What takes the most time",
  "Score",
  "Gaps",
  "Answers",
  "UTM source",
  "UTM medium",
  "UTM campaign",
  "Notified"
];

var GUARD_HEADERS = ["day", "rows", "mails", "burstStart", "burstCount"];

function doGet() {
  return json_({ success: true, service: "ddh-apply", revision: INTAKE_REVISION });
}

function doPost(e) {
  try {
    var raw = e && e.postData && e.postData.contents;
    if (!raw || raw.length > MAX_BODY) return rejected_();
    var data;
    try {
      data = JSON.parse(raw);
    } catch (ignore) {
      return rejected_();
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return rejected_();
    if (data.companyWebsite) return json_({ success: true, persisted: false, skipped: true });
    var clean = validate_(data);
    if (!clean) return rejected_();
    var stored = accept_(clean);
    if (!stored || !stored.ok) {
      var code = stored && (stored.code === "schema" || stored.code === "busy") ? stored.code : "error";
      return json_({ success: false, persisted: false, code: code });
    }
    var body = { success: true, persisted: true, notified: stored.notified };
    if (stored.duplicate) body.duplicate = true;
    return json_(body);
  } catch (ignoreError) {
    return json_({ success: false, persisted: false, code: "error" });
  }
}

function accept_(clean) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  var outcome;
  try {
    outcome = reserveAndAppend_(clean);
  } finally {
    lock.releaseLock();
  }
  if (!outcome || !outcome.ok || outcome.duplicate || !outcome.attemptMail) return outcome;
  var sent = notify_(clean);
  var marked = false;
  try {
    marked = markNotified_(clean.submissionId, sent);
  } catch (ignore) {
    marked = false;
  }
  outcome.notified = marked ? sent : null;
  return outcome;
}

function validate_(data) {
  var kind = text_(data.kind, 20);
  if (kind !== "apply" && kind !== "checkup") return null;
  var submissionId = text_(data.submissionId, 80);
  if (!/^[A-Za-z0-9-]{20,80}$/.test(submissionId)) return null;
  var email = text_(data.email, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  var name = text_(data.name, 200);
  if (!name) return null;
  var utmSource = text_(data.utmSource, 200);
  var utmMedium = text_(data.utmMedium, 200);
  var utmCampaign = text_(data.utmCampaign, 200);
  if (utmSource == null || utmMedium == null || utmCampaign == null) return null;
  if (kind === "apply") {
    var orgType = text_(data.orgType, 80);
    if (!ORG_TYPES[orgType]) return null;
    var role = text_(data.role, 200);
    var scale = text_(data.scale, 200);
    var pain = text_(data.pain, 4000);
    var systems = text_(data.systems, 500);
    var biTeam = text_(data.biTeam, 3);
    var billingPack = text_(data.billingPack, 3);
    if (role == null || scale == null || pain == null || systems == null || biTeam == null || billingPack == null) return null;
    if (!role || !scale || !pain) return null;
    if (biTeam !== "Yes" && biTeam !== "No") return null;
    if (billingPack !== "Yes" && billingPack !== "No") return null;
    var poor = orgType === "Other healthcare organization" || billingPack === "Yes";
    return {
      kind: kind,
      submissionId: submissionId,
      name: name,
      email: email,
      role: role,
      orgType: orgType,
      scale: scale,
      biTeam: biTeam,
      billingPack: billingPack,
      fit: poor ? "No" : "Yes",
      systems: systems || "Not specified",
      pain: pain,
      score: "",
      gaps: "",
      answers: "",
      utmSource: utmSource,
      utmMedium: utmMedium,
      utmCampaign: utmCampaign
    };
  }
  var organization = text_(data.organization, 200);
  var score = text_(data.score, 80);
  var gaps = text_(data.gaps, 2000);
  var answers = text_(data.answers, 8000);
  if (organization == null || score == null || gaps == null || answers == null) return null;
  if (!organization || !score || !answers) return null;
  return {
    kind: kind,
    submissionId: submissionId,
    name: name,
    email: email,
    role: "",
    orgType: organization,
    scale: "",
    biTeam: "",
    billingPack: "",
    fit: "",
    systems: "",
    pain: "",
    score: score,
    gaps: gaps,
    answers: answers,
    utmSource: utmSource,
    utmMedium: utmMedium,
    utmCampaign: utmCampaign
  };
}

function text_(value, maxLen) {
  if (value == null) return "";
  if (typeof value !== "string") return null;
  var s = value.replace(/^\s+|\s+$/g, "");
  if (s.length > maxLen) return null;
  return s;
}

function asText_(value) {
  return "'" + (value == null ? "" : String(value));
}

function logical_(value) {
  if (value instanceof Date) return "";
  var s = value == null ? "" : String(value);
  if (s.charAt(0) === "'") s = s.substring(1);
  return s;
}

function oneLine_(value) {
  return String(value == null ? "" : value).replace(/[\r\n]+/g, " ").substring(0, 140);
}

function currentMs_() {
  return Date.now();
}

function today_() {
  return Utilities.formatDate(new Date(currentMs_()), "America/New_York", "yyyy-MM-dd");
}

function dataSheet_(ss) {
  if (!ss) return null;
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName() !== GUARD_SHEET) return sheets[i];
  }
  return null;
}

function schemaState_(sheet) {
  if (!sheet || sheet.getLastRow() === 0) return "empty";
  var width = Math.max(sheet.getLastColumn(), HEADERS.length);
  var row = sheet.getRange(1, 1, 1, width).getValues()[0];
  for (var i = 0; i < HEADERS.length; i++) {
    if (logical_(row[i]).replace(/^\s+|\s+$/g, "") !== HEADERS[i]) return "mismatch";
  }
  for (var j = HEADERS.length; j < row.length; j++) {
    if (logical_(row[j]).replace(/^\s+|\s+$/g, "") !== "") return "mismatch";
  }
  return "ready";
}

function writeHeaders_(sheet) {
  var labels = [];
  for (var i = 0; i < HEADERS.length; i++) labels.push(asText_(HEADERS[i]));
  var range = sheet.getRange(1, 1, 1, HEADERS.length);
  range.setNumberFormat("@");
  range.setValues([labels]);
}

function rowValues_(clean, notice) {
  return [
    new Date(),
    asText_(clean.submissionId),
    asText_(clean.kind),
    asText_(clean.name),
    asText_(clean.email),
    asText_(clean.role),
    asText_(clean.orgType),
    asText_(clean.scale),
    asText_(clean.biTeam),
    asText_(clean.billingPack),
    asText_(clean.fit),
    asText_(clean.systems),
    asText_(clean.pain),
    asText_(clean.score),
    asText_(clean.gaps),
    asText_(clean.answers),
    asText_(clean.utmSource),
    asText_(clean.utmMedium),
    asText_(clean.utmCampaign),
    asText_(notice)
  ];
}

function writeDataRow_(sheet, clean, notice) {
  var values = rowValues_(clean, notice);
  var row = sheet.getLastRow() + 1;
  sheet.getRange(row, 2, 1, values.length - 1).setNumberFormat("@");
  sheet.getRange(row, 1, 1, values.length).setValues([values]);
  return row;
}

function find_(sheet, submissionId) {
  var last = sheet.getLastRow();
  if (last < 2) return null;
  var start = Math.max(2, last - (DEDUP_ROWS - 1));
  var count = last - start + 1;
  var ids = sheet.getRange(start, 2, count, 1).getValues();
  var notes = sheet.getRange(start, HEADERS.length, count, 1).getValues();
  for (var i = ids.length - 1; i >= 0; i--) {
    if (logical_(ids[i][0]) === submissionId) {
      return { row: start + i, notified: logical_(notes[i][0]) };
    }
  }
  return null;
}

function notifiedValue_(stored) {
  if (stored === "yes") return true;
  if (stored === "no") return false;
  return null;
}

function guardSheet_(ss) {
  var existing = ss.getSheetByName(GUARD_SHEET);
  if (existing) return existing;
  var created = ss.insertSheet(GUARD_SHEET);
  var labels = [];
  for (var i = 0; i < GUARD_HEADERS.length; i++) labels.push(asText_(GUARD_HEADERS[i]));
  var head = created.getRange(1, 1, 1, GUARD_HEADERS.length);
  head.setNumberFormat("@");
  head.setValues([labels]);
  writeGuard_(created, { day: today_(), rows: 0, mails: 0, burstStart: currentMs_(), burstCount: 0 });
  return created;
}

function readGuard_(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  var width = Math.max(sheet.getLastColumn(), GUARD_HEADERS.length);
  var header = sheet.getRange(1, 1, 1, width).getValues()[0];
  for (var i = 0; i < GUARD_HEADERS.length; i++) {
    if (logical_(header[i]).replace(/^\s+|\s+$/g, "") !== GUARD_HEADERS[i]) return null;
  }
  for (var j = GUARD_HEADERS.length; j < header.length; j++) {
    if (logical_(header[j]).replace(/^\s+|\s+$/g, "") !== "") return null;
  }
  var row = sheet.getRange(2, 1, 1, GUARD_HEADERS.length).getValues()[0];
  var state = {
    day: logical_(row[0]).replace(/^\s+|\s+$/g, ""),
    rows: count_(row[1]),
    mails: count_(row[2]),
    burstStart: count_(row[3]),
    burstCount: count_(row[4])
  };
  if (state.rows == null || state.mails == null || state.burstStart == null || state.burstCount == null) return null;
  return state;
}

function count_(value) {
  var s = logical_(value).replace(/^\s+|\s+$/g, "");
  if (s === "") return 0;
  if (!/^\d+$/.test(s)) return null;
  return Number(s);
}

function writeGuard_(sheet, state) {
  var range = sheet.getRange(2, 1, 1, GUARD_HEADERS.length);
  range.setNumberFormat("@");
  range.setValues([[
    asText_(state.day),
    asText_(String(state.rows)),
    asText_(String(state.mails)),
    asText_(String(state.burstStart)),
    asText_(String(state.burstCount))
  ]]);
}

function reserve_(sheet) {
  var state = readGuard_(sheet);
  if (!state) return { ok: false, code: "error" };
  var now = currentMs_();
  if (!state.burstStart || now - state.burstStart >= BURST_MS) {
    state.burstStart = now;
    state.burstCount = 0;
  }
  var day = today_();
  if (state.day !== day) {
    state.day = day;
    state.rows = 0;
    state.mails = 0;
  }
  if (state.burstCount >= BURST_LIMIT || state.rows >= DAILY_ROW_LIMIT) {
    return { ok: false, code: "busy" };
  }
  state.burstCount += 1;
  state.rows += 1;
  var attemptMail = state.mails < DAILY_MAIL_LIMIT;
  if (attemptMail) state.mails += 1;
  writeGuard_(sheet, state);
  return { ok: true, attemptMail: attemptMail };
}

function reserveAndAppend_(clean) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = dataSheet_(ss);
  if (!sheet) return { ok: false, code: "error" };
  var schema = schemaState_(sheet);
  if (schema === "mismatch") return { ok: false, code: "schema" };
  if (schema === "empty") writeHeaders_(sheet);
  var existing = find_(sheet, clean.submissionId);
  if (existing) return { ok: true, duplicate: true, notified: notifiedValue_(existing.notified), attemptMail: false };
  var slot = reserve_(guardSheet_(ss));
  if (!slot.ok) return slot;
  writeDataRow_(sheet, clean, slot.attemptMail ? "pending" : "no");
  return {
    ok: true,
    duplicate: false,
    attemptMail: slot.attemptMail,
    notified: slot.attemptMail ? null : false
  };
}

function markNotified_(submissionId, sent) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = dataSheet_(SpreadsheetApp.getActiveSpreadsheet());
    var found = sheet && find_(sheet, submissionId);
    if (!found) return false;
    var cell = sheet.getRange(found.row, HEADERS.length);
    cell.setNumberFormat("@");
    cell.setValue(asText_(sent ? "yes" : "no"));
    return true;
  } finally {
    lock.releaseLock();
  }
}

function notify_(clean) {
  try {
    if (MailApp.getRemainingDailyQuota() < 1) return false;
    var subject = clean.kind === "checkup"
      ? "Health Check: " + oneLine_(clean.orgType)
      : ((clean.fit === "No" ? "Outside current fit: " : "Reporting Review application: ") + oneLine_(clean.orgType));
    MailApp.sendEmail({
      to: NOTIFY,
      replyTo: clean.email,
      subject: subject,
      body: mailBody_(clean)
    });
    return true;
  } catch (ignore) {
    return false;
  }
}

function mailBody_(clean) {
  var lines = [
    "Kind: " + clean.kind,
    "Submission id: " + clean.submissionId,
    "Name: " + oneLine_(clean.name),
    "Email: " + oneLine_(clean.email),
    "Role: " + oneLine_(clean.role),
    "Organization: " + oneLine_(clean.orgType),
    "Locations or providers: " + oneLine_(clean.scale),
    "BI team: " + clean.biTeam,
    "Billing package: " + clean.billingPack,
    "Fit for a Review call: " + clean.fit,
    "Systems: " + oneLine_(clean.systems),
    "What takes the most time: " + oneLine_(clean.pain),
    "Score: " + oneLine_(clean.score),
    "Gaps: " + oneLine_(clean.gaps),
    "UTM source: " + oneLine_(clean.utmSource),
    "UTM medium: " + oneLine_(clean.utmMedium),
    "UTM campaign: " + oneLine_(clean.utmCampaign)
  ];
  if (clean.answers) lines.push("Answers:\n" + String(clean.answers).substring(0, 8000));
  return lines.join("\n");
}

function rejected_() {
  return json_({ success: false, persisted: false, code: "invalid" });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
