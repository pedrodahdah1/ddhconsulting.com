/**
 * DDH Consulting application intake.
 * Bound to the Google Sheet (Extensions > Apps Script).
 * Deploy as a web app: Execute as Me, access Anyone.
 * See SETUP.md.
 *
 * The web app appends one row and emails contact@ddhbiconsulting.com.
 * A confirmed { success: true } means both happened.
 */
var NOTIFY = "contact@ddhbiconsulting.com";

var HEADERS = [
  "Timestamp",
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
  "UTM source",
  "UTM medium",
  "UTM campaign"
];

function doGet() {
  return json_({ success: true, service: "ddh-apply" });
}

function doPost(e) {
  try {
    var data = readBody_(e);
    if (data.companyWebsite || data._honey) {
      return json_({ success: true, skipped: true });
    }
    var row = [
      new Date(),
      str_(data.name),
      str_(data.email),
      str_(data.role),
      str_(data.orgType),
      str_(data.scale),
      str_(data.biTeam),
      str_(data.billingPack),
      str_(data.fit),
      str_(data.systems),
      str_(data.pain),
      str_(data.utmSource),
      str_(data.utmMedium),
      str_(data.utmCampaign)
    ];
    MailApp.sendEmail({
      to: NOTIFY,
      replyTo: str_(data.email) || NOTIFY,
      subject: (data.fit === "No" ? "Outside current fit: " : "Reporting Review application: ") + str_(data.orgType),
      body: body_(row)
    });
    append_(row);
    return json_({ success: true });
  } catch (err) {
    return json_({ success: false, message: String(err) });
  }
}

function readBody_(e) {
  var raw = e && e.postData && e.postData.contents;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (ignore) {}
  }
  return (e && e.parameter) || {};
}

function append_(row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
}

function body_(row) {
  var lines = [];
  for (var i = 0; i < HEADERS.length; i++) {
    lines.push(HEADERS[i] + ": " + row[i]);
  }
  return lines.join("\n");
}

function str_(value) {
  return value == null ? "" : String(value);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
