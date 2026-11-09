// Inactive until a new deployment of apps-script/Code.gs is tested in a browser.
// Do not paste the previously deployed /exec URL. That deployment is the old script.
// A value in this file is visible to every visitor. It is not a secret and it is not access control.
var SHEET_WEB_APP_URL = "";

var Intake = {
  id: function () {
    if (window.crypto && typeof crypto.randomUUID === "function") return crypto.randomUUID();
    return "sub-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14);
  },
  post: function (payload) {
    if (!SHEET_WEB_APP_URL) return Promise.resolve({ persisted: false });
    return fetch(SHEET_WEB_APP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = null;
        try { data = JSON.parse(text); } catch (ignore) { data = null; }
        if (!data || data.persisted !== true) return { persisted: false };
        return data;
      });
    }).catch(function () {
      return { persisted: false };
    });
  }
};
