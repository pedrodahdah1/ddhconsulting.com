/**
 * @OnlyCurrentDoc
 *
 * DDH Consulting intake. Container-bound to one spreadsheet.
 * Deploy as a web app: Execute as me, access Anyone.
 * See SETUP.md before replacing the live URL.
 *
 * @OnlyCurrentDoc asks Apps Script for spreadsheets.currentonly instead of
 * every spreadsheet. Google documents that annotation for an add-on or other
 * script. It is not documented as proven for an anonymous web app that runs
 * as the owner with no spreadsheet open. Do not treat the consent screen as
 * narrowed until a new deployment shows the narrower sentence and a test
 * append succeeds. This file does not request Gmail read access.
 */
var NOTIFY = "contact@ddhbiconsulting.com";
var MAX_BODY = 30000;
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
  "UTM campaign"
];

function doGet() {
  return json_({ success: true, service: "ddh-apply" });
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
    var stored = store_(clean);
    if (stored.duplicate) return json_({ success: true, persisted: true, duplicate: true, notified: true });
    return json_({ success: true, persisted: true, notified: notify_(clean) });
  } catch (ignoreError) {
    return json_({ success: false, persisted: false, code: "error" });
  }
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

function sanitizeCell_(value) {
  var s = value == null ? "" : String(value);
  if (s.length && /^[=+\-@\t\r]/.test(s)) return "'" + s;
  return s;
}

function oneLine_(value) {
  return String(value == null ? "" : value).replace(/[\r\n]+/g, " ").substring(0, 140);
}

function rowFrom_(clean) {
  return [
    new Date(),
    clean.submissionId,
    clean.kind,
    sanitizeCell_(clean.name),
    sanitizeCell_(clean.email),
    sanitizeCell_(clean.role),
    sanitizeCell_(clean.orgType),
    sanitizeCell_(clean.scale),
    sanitizeCell_(clean.biTeam),
    sanitizeCell_(clean.billingPack),
    sanitizeCell_(clean.fit),
    sanitizeCell_(clean.systems),
    sanitizeCell_(clean.pain),
    sanitizeCell_(clean.score),
    sanitizeCell_(clean.gaps),
    sanitizeCell_(clean.answers),
    sanitizeCell_(clean.utmSource),
    sanitizeCell_(clean.utmMedium),
    sanitizeCell_(clean.utmCampaign)
  ];
}

function store_(clean) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    if (seen_(sheet, clean.submissionId)) return { duplicate: true };
    sheet.appendRow(rowFrom_(clean));
    return { duplicate: false };
  } finally {
    lock.releaseLock();
  }
}

function seen_(sheet, submissionId) {
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var start = Math.max(2, last - 1999);
  var values = sheet.getRange(start, 2, last - start + 1, 1).getValues();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]) === submissionId) return true;
  }
  return false;
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
