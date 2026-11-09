# Intake web app setup

The live site does not call this script until `SHEET_WEB_APP_URL` in `assets/intake.js` is changed from `""` to a new deployment URL. Leave it empty. The previously deployed `/exec` URL runs the older script and must not be pasted back in.

Do not send a test application, and do not point the site at the script, until Pedro explicitly authorizes that test.

## What the consent screen is asking

`Code.gs` uses `SpreadsheetApp` and `MailApp`. It does not read Gmail.

- `https://www.googleapis.com/auth/script.send_mail` lets the script send mail as the account that authorized it. MailApp cannot read the inbox. Official reference: https://developers.google.com/apps-script/reference/mail/mail-app
- `https://www.googleapis.com/auth/spreadsheets` is the broad scope whose consent sentence is “See, edit, create, and delete all your Google Sheets spreadsheets.” Official list: https://developers.google.com/workspace/sheets/api/scopes
- `https://www.googleapis.com/auth/spreadsheets.currentonly` is the narrower Apps Script scope. `getActiveSpreadsheet()` is documented to accept either scope: https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
- `@OnlyCurrentDoc` is how Apps Script is told to request that narrower scope for an add-on or other script: https://developers.google.com/apps-script/guides/services/authorization

This project sets both the annotation and `oauthScopes` in `appsscript.json`. Google’s web-app guide does not say that an anonymous “execute as me” web app, with no spreadsheet open, will succeed on `spreadsheets.currentonly`. That part is unproven here. On the next deployment, read the consent screen:

- If it still says all spreadsheets, the narrow scope was not applied. Stop. Do not paste the URL into the site.
- If it names only the current spreadsheet, the prompt is narrower. It is still not proven until one authorized test appends a row.

“Execute as me” plus “Anyone” means every caller runs as the owner. Official description: https://developers.google.com/apps-script/guides/web. The recipient is fixed at `contact@ddhbiconsulting.com`. Callers cannot choose another mailbox, so this is not an open relay to arbitrary addresses. They can still submit many times and consume the owner’s MailApp quota (100 recipients/day on a consumer account, 1,500 on Workspace): https://developers.google.com/apps-script/guides/services/quotas

A secret embedded in the public page is not a secret. This script does not pretend otherwise. There is no extra account or paid service in this change. A real rate limit or login wall would be a separate decision.

## Deploy this version

1. Open the intake spreadsheet. Extensions, Apps Script.
2. Replace `Code.gs` with `apps-script/Code.gs` from this branch.
3. Open Project Settings, show the manifest, and replace `appsscript.json` with `apps-script/appsscript.json`.
4. Deploy, New deployment, Web app. Execute as Me. Who has access: Anyone.
5. Authorize only if the consent sentence matches the narrower sheet access described above. Copy the new `/exec` URL.
6. Do not put that URL in `assets/intake.js` until Pedro authorizes an end-to-end browser test.

`doGet` returning `{"success":true,"service":"ddh-apply"}` only shows that the deployment answers. It does not write a row or send mail.

## After an authorized test

Paste the new `/exec` URL into `SHEET_WEB_APP_URL` in `assets/intake.js`. Publish the site only after a browser on the site shows the booking button solely when the response says `persisted: true`, and the test row is the one you sent.

If the sheet append fails, the page tells the visitor to email `contact@ddhbiconsulting.com` and does not open a mail draft. If the row is saved and the notification email is not, the booking button can still appear, with a line that the confirmation email did not send.
