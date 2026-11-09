# Intake web app setup

The live site does not call this script. `SHEET_WEB_APP_URL` in `assets/intake.js` stays `""` until the checks below are done by a person. Do not paste a deployment URL in that file as part of publishing this branch.

`doGet` returns `{"success":true,"service":"ddh-apply","revision":"2026-11-09.3"}`. That revision identifies this file. It does not prove the Google account's granted scopes, which sheet is bound, or that mail reached a mailbox.

## What this version changes

- A repeated submission id does not send another email. The response `notified` is `true`, `false`, or `null`. `null` means the stored row does not say whether mail was sent. The page must not invent a success, and it must not submit again.
- Every lead-log text cell is written as plain text: number format `@`, and a leading apostrophe so Google Sheets does not treat the value as a formula. The timestamp stays a date.
- If row 1 of the lead log is not exactly the header list in `Code.gs`, the script writes nothing and returns `code: "schema"`. It does not rename columns or rewrite existing rows.
- New rows and notification emails stop at a global cap shared by every caller. This is not a per-person limit. The page has no secret. Anyone who can call the web app shares the cap.
- `GET` does not include the recipient, the sheet id, or the cap numbers.

## Caps

Counted in America/New_York, on a sheet named `_intake_guard`:

| Cap | Value | When it is reached |
| --- | --- | --- |
| Burst | 8 new rows per 10 minutes | Response `code: "busy"`. Nothing is stored. |
| Rows | 40 new rows per day | Same as burst. |
| Mail | 30 notification emails per day | The row is still stored, `notified` is `false`, and MailApp is not called. |

Duplicates do not consume these caps. Invalid requests and the honeypot do not either. A full MailApp quota also stores the row and returns `notified: false`.

The caps are global. Two real applicants in the same 10 minutes count together. Deleting `_intake_guard` resets the counters the next time the script creates it. A guard sheet whose header is not `day`, `rows`, `mails`, `burstStart`, `burstCount` makes new submissions fail with `code: "error"` and does not reset the numbers.

These caps do not replace Google's own MailApp quota. They are there so one anonymous caller cannot spend the whole daily quota in one burst.

## Sheet layout

The lead log is the first sheet whose name is not `_intake_guard`. The script adds the guard sheet if it is missing. Do not rename the lead log to `_intake_guard`.

Header row, in order:

1. Timestamp
2. Submission id
3. Kind
4. Name
5. Email
6. Role
7. Organization type
8. Locations or providers
9. BI team
10. Billing company sends a full monthly package
11. Fit for a Review call
12. Systems
13. What takes the most time
14. Score
15. Gaps
16. Answers
17. UTM source
18. UTM medium
19. UTM campaign
20. Notified

`Notified` is `pending` while mail is being attempted, then `yes` or `no`. A blank cell means unknown. The script does not send mail again for that id.

An id is recognized only in the latest 2000 data rows. The same id older than that window can be stored and emailed again. That limit is intentional and is not a login.

## Safe migration

Use this when the bound sheet already has rows, including a test row from the previous script.

The script will not migrate the sheet for you. Do not delete lead rows.

Preferred: leave the old spreadsheet as an archive. Bind this script to a new empty spreadsheet, whose first sheet has no rows. The first accepted submission writes the header above. Deploy that project. The old deployment URL should be left unpublished or replaced by a new deployment of this file.

Alternative, only if row 1 columns A through S already match items 1 through 19 above and column T is empty on every row: type `Notified` in cell T1 and leave every data cell in column T blank. Blank means unknown. Do not reorder columns. Do not paste the word into a data row. If any header cell differs, stop and use a new empty spreadsheet instead. A mismatched sheet must keep returning `schema` rather than lining new answers up under the wrong names.

## Deploy

1. Open the intake spreadsheet. Extensions, Apps Script.
2. Replace `Code.gs` and `appsscript.json` with the files from this branch.
3. Deploy, New deployment, Web app. Execute as Me. Who has access: Anyone.
4. Authorize only if the consent sentence names the current spreadsheet, not every spreadsheet. `appsscript.json` requests `spreadsheets.currentonly` and `script.send_mail`. No new consent screen does not prove the old broader grant was revoked. Revoke the old DDH BI Intake authorization and authorize again before trusting the narrower scope.
5. `GET` the new `/exec` URL. Confirm `revision` is `2026-11-09.3`. Do not treat that as a test submission.
6. Do not put that URL in `assets/intake.js` until a person has confirmed the header row, the consent sentence, one authorized test row, and the notification mailbox.

The recipient is fixed at `contact@ddhbiconsulting.com`. Callers cannot choose another mailbox. `replyTo` is the address they typed, so a reply from the inbox goes to that address.

## What the website does while the URL is empty

Apply and the Health Check do not call the web app. They say the application was not saved and show `contact@ddhbiconsulting.com` as a normal link. Calendly stays hidden. The live site is still on FormSubmit until this branch is deployed separately. This branch does not connect it.
