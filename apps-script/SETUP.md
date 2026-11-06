# Application sheet setup

The apply form emails `contact@ddhbiconsulting.com` and adds a row to a Google Sheet. Until you paste the web app URL into the site, the form tries FormSubmit for email only. A browser test on 6 Nov 2026 could not get a JSON reply from FormSubmit (Cloudflare returned a challenge page, and Chrome reported `Failed to fetch`), so the reliable path is this script. After you deploy it, the script sends the email and appends the row. The page shows the booking link only when that call returns success.

## 1. Create the Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a blank spreadsheet.
2. Name it something you will recognize, such as `DDH applications`.

## 2. Add the script

1. In the sheet, open **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with the file `apps-script/Code.gs` from this repo.
3. Save.

## 3. Deploy the web app

1. Click **Deploy → New deployment**.
2. Click the gear and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy** and authorize the requested Gmail and Sheets permissions.
6. Copy the web app URL. It ends in `/exec`.

If you change the script later, deploy a **new version**. An old `/exec` URL keeps running the previous code until you do.

## 4. Paste the URL into the site

In `apply.html`, set the empty constant:

```javascript
var SHEET_WEB_APP_URL = "https://script.google.com/macros/s/XXXX/exec";
```

Leave it as `""` if you are not ready. The form then stays on the email-only path.

## 5. Check it

Open the `/exec` URL in a browser. You should see `{"success":true,"service":"ddh-apply"}`.

Then submit a test application on `/apply.html`. A qualified application should show the Calendly button only after the script accepts it. The sheet should gain one row, and `contact@ddhbiconsulting.com` should get the email. UTM source, medium, and campaign are blank unless the visitor arrived with `?utm_source=&utm_medium=&utm_campaign=` on the link.
